import asyncio
import logging
import re
import json
from datetime import datetime
from typing import Dict, Any, List, Optional, Tuple
from urllib.parse import urlparse

import aiohttp
from bs4 import BeautifulSoup
from openai import AsyncOpenAI
from langchain.text_splitter import RecursiveCharacterTextSplitter

from app.core.config import settings
from app.core.database import fetch_one, update_row, insert_row
from app.models.lead import Lead

# Initialize OpenAI client
client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
logger = logging.getLogger(__name__)

# Constants
MAX_CONTENT_LENGTH = 100000  # Maximum content length to process
MAX_CONCURRENT_SCRAPES = 5  # Maximum number of concurrent scraping tasks
SCRAPE_TIMEOUT = 30  # Timeout for scraping in seconds
BATCH_SIZE = 10  # Number of leads to process in a batch

class WebScrapingStatus:
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    INVALID_URL = "invalid_url"
    NO_CONTENT = "no_content"

async def validate_url(url: str) -> str:
    """
    Validate and normalize URL format.
    """
    if not url:
        return ""
    
    # Add http:// if no protocol specified
    if not url.startswith(('http://', 'https://')):
        url = 'https://' + url
    
    # Parse the URL to validate it
    try:
        parsed = urlparse(url)
        if not parsed.netloc:
            return ""
        return url
    except Exception as e:
        logger.error(f"Error validating URL {url}: {str(e)}")
        return ""

async def extract_company_website(lead: Dict[str, Any]) -> str:
    """
    Extract company website from lead data.
    """
    # Check if there's a website in custom_fields
    custom_fields = lead.get("custom_fields", {})
    if custom_fields and isinstance(custom_fields, dict):
        website = custom_fields.get("website", "")
        if website:
            return await validate_url(website)
    
    # Check if company name exists and try to construct a URL
    company = lead.get("company", "")
    if company:
        # Simple heuristic to create a potential website
        # Remove spaces, special chars and add .com
        potential_url = re.sub(r'[^\w]', '', company.lower()) + ".com"
        return await validate_url(potential_url)
    
    return ""

async def scrape_website(url: str) -> Tuple[str, str, List[str]]:
    """
    Scrape website content.
    Returns a tuple of (content, title, subpages)
    """
    if not url:
        return "", "", []
    
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(url, timeout=SCRAPE_TIMEOUT) as response:
                if response.status != 200:
                    logger.warning(f"Failed to scrape {url}, status code: {response.status}")
                    return "", "", []
                
                html = await response.text()
                
                # Parse HTML
                soup = BeautifulSoup(html, 'html.parser')
                
                # Get title
                title = soup.title.string if soup.title else ""
                
                # Extract text content
                # Remove script and style elements
                for script in soup(["script", "style"]):
                    script.extract()
                
                # Get text
                text = soup.get_text(separator=' ', strip=True)
                
                # Normalize whitespace
                text = re.sub(r'\s+', ' ', text).strip()
                
                # Limit content length
                if len(text) > MAX_CONTENT_LENGTH:
                    text = text[:MAX_CONTENT_LENGTH]
                
                # Extract important subpages (about, services, products, etc.)
                subpages = []
                important_keywords = ['about', 'services', 'products', 'team', 'contact']
                base_url = f"{urlparse(url).scheme}://{urlparse(url).netloc}"
                
                for link in soup.find_all('a', href=True):
                    href = link['href']
                    # Skip external links, anchors, etc.
                    if href.startswith('#') or href.startswith('mailto:') or href.startswith('tel:'):
                        continue
                    
                    # Convert relative URLs to absolute
                    if not href.startswith(('http://', 'https://')):
                        if href.startswith('/'):
                            href = base_url + href
                        else:
                            href = base_url + '/' + href
                    
                    # Only include links from the same domain
                    if urlparse(href).netloc == urlparse(url).netloc:
                        # Check if the link contains important keywords
                        for keyword in important_keywords:
                            if keyword in href.lower():
                                subpages.append(href)
                                break
                
                # Limit number of subpages
                subpages = list(set(subpages))[:5]  # Remove duplicates and limit to 5
                
                return text, title, subpages
    except asyncio.TimeoutError:
        logger.warning(f"Timeout while scraping {url}")
        return "", "", []
    except Exception as e:
        logger.error(f"Error scraping {url}: {str(e)}")
        return "", "", []

async def scrape_subpages(subpages: List[str]) -> Dict[str, str]:
    """
    Scrape content from subpages.
    """
    results = {}
    
    async def scrape_page(url):
        content, _, _ = await scrape_website(url)
        return url, content
    
    # Create tasks for all subpages
    tasks = [scrape_page(url) for url in subpages]
    
    # Run tasks concurrently with a limit
    for i in range(0, len(tasks), MAX_CONCURRENT_SCRAPES):
        batch = tasks[i:i+MAX_CONCURRENT_SCRAPES]
        if batch:
            batch_results = await asyncio.gather(*batch)
            for url, content in batch_results:
                if content:
                    results[url] = content
    
    return results

async def analyze_company_content(main_content: str, title: str, subpage_contents: Dict[str, str], company_name: str) -> Dict[str, Any]:
    """
    Analyze company website content using LLM.
    """
    # Combine all content
    all_content = main_content
    for url, content in subpage_contents.items():
        all_content += f"\n\nContent from {url}:\n{content}"
    
    # Split content if it's too large
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=8000,
        chunk_overlap=200,
        length_function=len,
    )
    
    chunks = text_splitter.split_text(all_content)
    
    # If we have multiple chunks, summarize each and then combine
    if len(chunks) > 1:
        summaries = []
        
        for i, chunk in enumerate(chunks):
            try:
                response = await client.chat.completions.create(
                    model=settings.DEFAULT_MODEL,
                    messages=[
                        {"role": "system", "content": "You are a business analyst assistant. Summarize the key information from this website content."},
                        {"role": "user", "content": f"Summarize the following website content for {company_name}. Focus on extracting key business information:\n\n{chunk}"}
                    ],
                    max_tokens=1000
                )
                summaries.append(response.choices[0].message.content)
            except Exception as e:
                logger.error(f"Error summarizing chunk {i}: {str(e)}")
        
        # Combine summaries
        combined_content = "\n\n".join(summaries)
    else:
        combined_content = all_content
    
    # Analyze the content
    try:
        prompt = f"""
        Analyze the following website content for the company {company_name}:
        
        Title: {title}
        
        Content:
        {combined_content}
        
        Provide a comprehensive analysis in JSON format with the following structure:
        1. "company_summary": A concise summary of what the company does (max 200 words)
        2. "industry": The industry or industries the company operates in
        3. "products_services": List of main products or services offered
        4. "value_proposition": The company's main value proposition
        5. "target_audience": Who the company's products/services are aimed at
        6. "company_size_estimate": Estimated company size (small, medium, large)
        7. "strengths": Key strengths of the company
        8. "opportunities": Potential opportunities for sales engagement
        9. "conversion_strategy": Suggested approach for converting this lead
        10. "key_topics": Important topics to discuss with this lead
        11. "potential_pain_points": Potential challenges the company might be facing
        12. "lead_score_factors": Factors that should influence the lead score (positive or negative)
        
        Respond with ONLY the JSON object, no additional text.
        """
        
        response = await client.chat.completions.create(
            model=settings.DEFAULT_MODEL,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": "You are a business analyst assistant. Analyze website content and provide structured insights in JSON format only."},
                {"role": "user", "content": prompt}
            ]
        )
        
        # Parse the result
        result = json.loads(response.choices[0].message.content)
        
        # Add metadata
        result["analysis_timestamp"] = datetime.now().isoformat()
        result["content_length"] = len(all_content)
        result["subpages_analyzed"] = len(subpage_contents)
        
        return result
    except Exception as e:
        logger.error(f"Error analyzing content: {str(e)}")
        return {
            "company_summary": f"Failed to analyze content for {company_name}",
            "error": str(e),
            "analysis_timestamp": datetime.now().isoformat()
        }

async def update_lead_score_from_analysis(lead_id: int, analysis: Dict[str, Any]) -> float:
    """
    Update lead score based on company analysis.
    """
    try:
        # Get current lead score
        lead_data = await fetch_one("leads", {"id": lead_id})
        if not lead_data:
            return 0.0
        
        current_score = lead_data.get("lead_score", 0.0)
        
        # Extract lead score factors from analysis
        lead_score_factors = analysis.get("lead_score_factors", [])
        
        # Calculate score adjustment based on analysis
        # This is a simple implementation - you might want to make this more sophisticated
        score_adjustment = 0.0
        
        if lead_score_factors and isinstance(lead_score_factors, list):
            # Each factor can contribute up to +/- 5 points
            score_adjustment = min(len(lead_score_factors) * 5, 20)
        
        # Adjust for content quality
        content_length = analysis.get("content_length", 0)
        if content_length > 5000:
            score_adjustment += 5
        elif content_length > 1000:
            score_adjustment += 2
        
        # Adjust for subpages analyzed
        subpages_analyzed = analysis.get("subpages_analyzed", 0)
        score_adjustment += min(subpages_analyzed * 2, 10)
        
        # Calculate new score
        new_score = min(max(current_score + score_adjustment, 0), 100)
        
        # Update lead score
        await update_row("leads", {"id": lead_id}, {"lead_score": new_score})
        
        return new_score
    except Exception as e:
        logger.error(f"Error updating lead score: {str(e)}")
        return current_score

async def process_single_lead(lead_id: int) -> Dict[str, Any]:
    """
    Process a single lead for web scraping and analysis.
    """
    try:
        # Get lead data
        lead_data = await fetch_one("leads", {"id": lead_id})
        if not lead_data:
            return {"status": WebScrapingStatus.FAILED, "message": "Lead not found"}
        
        # Update scraping status
        await update_row(
            "company_analyses", 
            {"lead_id": lead_id}, 
            {"status": WebScrapingStatus.IN_PROGRESS, "updated_at": datetime.now().isoformat()},
            upsert=True
        )
        
        # Extract company website
        website_url = await extract_company_website(lead_data)
        
        if not website_url:
            await update_row(
                "company_analyses", 
                {"lead_id": lead_id}, 
                {
                    "status": WebScrapingStatus.INVALID_URL, 
                    "updated_at": datetime.now().isoformat(),
                    "result": json.dumps({"error": "No valid company website found"})
                }
            )
            
            # Negatively impact lead score
            lead_score = lead_data.get("lead_score", 0.0)
            new_score = max(lead_score - 10, 0)  # Reduce score by 10 points, minimum 0
            await update_row("leads", {"id": lead_id}, {"lead_score": new_score})
            
            return {"status": WebScrapingStatus.INVALID_URL, "message": "No valid company website found"}
        
        # Scrape main website
        main_content, title, subpages = await scrape_website(website_url)
        
        if not main_content:
            await update_row(
                "company_analyses", 
                {"lead_id": lead_id}, 
                {
                    "status": WebScrapingStatus.NO_CONTENT, 
                    "updated_at": datetime.now().isoformat(),
                    "result": json.dumps({"error": "No content found on website", "url": website_url})
                }
            )
            
            # Negatively impact lead score
            lead_score = lead_data.get("lead_score", 0.0)
            new_score = max(lead_score - 5, 0)  # Reduce score by 5 points, minimum 0
            await update_row("leads", {"id": lead_id}, {"lead_score": new_score})
            
            return {"status": WebScrapingStatus.NO_CONTENT, "message": "No content found on website"}
        
        # Scrape subpages
        subpage_contents = await scrape_subpages(subpages)
        
        # Analyze content
        company_name = lead_data.get("company", "")
        analysis_result = await analyze_company_content(main_content, title, subpage_contents, company_name)
        
        # Update lead score based on analysis
        new_score = await update_lead_score_from_analysis(lead_id, analysis_result)
        
        # Store analysis result
        await update_row(
            "company_analyses", 
            {"lead_id": lead_id}, 
            {
                "status": WebScrapingStatus.COMPLETED, 
                "updated_at": datetime.now().isoformat(),
                "result": json.dumps(analysis_result),
                "website_url": website_url,
                "content_length": len(main_content) + sum(len(content) for content in subpage_contents.values()),
                "subpages_analyzed": len(subpage_contents)
            }
        )
        
        return {
            "status": WebScrapingStatus.COMPLETED, 
            "message": "Analysis completed successfully",
            "lead_id": lead_id,
            "new_score": new_score,
            "analysis": analysis_result
        }
    except Exception as e:
        logger.error(f"Error processing lead {lead_id}: {str(e)}")
        
        # Update status to failed
        await update_row(
            "company_analyses", 
            {"lead_id": lead_id}, 
            {
                "status": WebScrapingStatus.FAILED, 
                "updated_at": datetime.now().isoformat(),
                "result": json.dumps({"error": str(e)})
            },
            upsert=True
        )
        
        return {"status": WebScrapingStatus.FAILED, "message": str(e), "lead_id": lead_id}

async def process_leads_batch(lead_ids: List[int]) -> Dict[str, Any]:
    """
    Process a batch of leads for web scraping and analysis.
    """
    results = []
    
    # Process leads concurrently with a limit
    for i in range(0, len(lead_ids), MAX_CONCURRENT_SCRAPES):
        batch = lead_ids[i:i+MAX_CONCURRENT_SCRAPES]
        if batch:
            tasks = [process_single_lead(lead_id) for lead_id in batch]
            batch_results = await asyncio.gather(*tasks)
            results.extend(batch_results)
    
    return {
        "total": len(lead_ids),
        "processed": len(results),
        "completed": sum(1 for r in results if r.get("status") == WebScrapingStatus.COMPLETED),
        "failed": sum(1 for r in results if r.get("status") in [WebScrapingStatus.FAILED, WebScrapingStatus.INVALID_URL, WebScrapingStatus.NO_CONTENT]),
        "results": results
    }

async def get_company_analysis(lead_id: int) -> Dict[str, Any]:
    """
    Get company analysis for a lead.
    """
    analysis_data = await fetch_one("company_analyses", {"lead_id": lead_id})
    
    if not analysis_data:
        return {
            "lead_id": lead_id,
            "status": WebScrapingStatus.PENDING,
            "message": "Analysis not yet performed"
        }
    
    result = {
        "lead_id": lead_id,
        "status": analysis_data.get("status", WebScrapingStatus.PENDING),
        "updated_at": analysis_data.get("updated_at"),
        "website_url": analysis_data.get("website_url", "")
    }
    
    # Parse result JSON if available
    if analysis_data.get("result"):
        try:
            result["analysis"] = json.loads(analysis_data["result"])
        except:
            result["analysis"] = {"error": "Failed to parse analysis result"}
    
    return result

async def trigger_web_scraping_for_lead(lead_id: int) -> Dict[str, Any]:
    """
    Trigger web scraping for a single lead.
    """
    # Check if analysis already exists
    analysis_data = await fetch_one("company_analyses", {"lead_id": lead_id})
    
    if analysis_data and analysis_data.get("status") == WebScrapingStatus.IN_PROGRESS:
        return {
            "status": WebScrapingStatus.IN_PROGRESS,
            "message": "Web scraping already in progress"
        }
    
    # Create or update analysis record with pending status
    await update_row(
        "company_analyses", 
        {"lead_id": lead_id}, 
        {"status": WebScrapingStatus.PENDING, "updated_at": datetime.now().isoformat()},
        upsert=True
    )
    
    # Process lead asynchronously
    asyncio.create_task(process_single_lead(lead_id))
    
    return {
        "status": WebScrapingStatus.PENDING,
        "message": "Web scraping initiated"
    }

async def trigger_web_scraping_for_leads(lead_ids: List[int]) -> Dict[str, Any]:
    """
    Trigger web scraping for multiple leads.
    """
    if not lead_ids:
        return {
            "status": "error",
            "message": "No lead IDs provided"
        }
    
    # Process in batches
    for i in range(0, len(lead_ids), BATCH_SIZE):
        batch = lead_ids[i:i+BATCH_SIZE]
        if batch:
            # Create or update analysis records with pending status
            for lead_id in batch:
                await update_row(
                    "company_analyses", 
                    {"lead_id": lead_id}, 
                    {"status": WebScrapingStatus.PENDING, "updated_at": datetime.now().isoformat()},
                    upsert=True
                )
            
            # Process batch asynchronously
            asyncio.create_task(process_leads_batch(batch))
    
    return {
        "status": "success",
        "message": f"Web scraping initiated for {len(lead_ids)} leads",
        "total_leads": len(lead_ids),
        "batches": (len(lead_ids) + BATCH_SIZE - 1) // BATCH_SIZE
    }

class WebScrapingService:
    """
    Service class for web scraping functionality.
    """
    
    @staticmethod
    async def process_single_lead(lead_id: int) -> Dict[str, Any]:
        return await process_single_lead(lead_id)
    
    @staticmethod
    async def process_leads_batch(lead_ids: List[int]) -> Dict[str, Any]:
        return await process_leads_batch(lead_ids)
    
    @staticmethod
    async def get_company_analysis(lead_id: int) -> Dict[str, Any]:
        return await get_company_analysis(lead_id)
    
    @staticmethod
    async def trigger_web_scraping_for_lead(lead_id: int) -> Dict[str, Any]:
        return await trigger_web_scraping_for_lead(lead_id)
    
    @staticmethod
    async def trigger_web_scraping_for_leads(lead_ids: List[int]) -> Dict[str, Any]:
        return await trigger_web_scraping_for_leads(lead_ids) 