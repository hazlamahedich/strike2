# Technical Implementation Guide: Integrating STRIKE Chatbot with User Manual

## Overview

This document outlines the technical approach for integrating the STRIKE chatbot with the user manual to create an interactive help system. This integration enables users to access manual content through natural language queries and receive contextual assistance.

## Architecture

![Chatbot-Manual Integration Architecture](https://placeholder-for-architecture-diagram.com)

### Components

1. **User Manual Repository**
   - Markdown files stored in a version-controlled repository
   - Structured with consistent headers and sections
   - Images and diagrams stored alongside text content

2. **Vector Database**
   - Embeddings of manual content chunks
   - Metadata including section headers, page references
   - Fast similarity search capabilities

3. **Retrieval System**
   - Query processing and reformulation
   - Relevance ranking algorithms
   - Context-aware retrieval logic

4. **Chatbot Backend**
   - LangGraph-based agent system
   - Tool calling for database queries
   - Natural language to SQL conversion
   - Response generation with citations

5. **User Interface**
   - Floating chat widget
   - Rich text display with markdown support
   - Interactive elements for tutorials

## Implementation Steps

### 1. Manual Content Processing

```python
# Example code for processing manual content
import markdown
from bs4 import BeautifulSoup
import re

def process_manual_file(file_path):
    """Process a markdown file into chunks with metadata."""
    with open(file_path, 'r') as f:
        md_content = f.read()
    
    # Convert markdown to HTML for easier parsing
    html_content = markdown.markdown(md_content)
    soup = BeautifulSoup(html_content, 'html.parser')
    
    chunks = []
    current_section = {"title": "", "level": 0, "content": "", "path": file_path}
    
    for element in soup.find_all(['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'ul', 'ol']):
        if element.name.startswith('h'):
            # Save previous section if it exists
            if current_section["content"]:
                chunks.append(current_section.copy())
            
            # Start new section
            level = int(element.name[1])
            current_section = {
                "title": element.text,
                "level": level,
                "content": element.text + "\n",
                "path": file_path
            }
        else:
            # Add content to current section
            current_section["content"] += element.text + "\n"
    
    # Add the last section
    if current_section["content"]:
        chunks.append(current_section)
    
    return chunks
```

### 2. Vector Database Setup

```python
# Example code for creating and storing embeddings
from langchain.embeddings import OpenAIEmbeddings
from langchain.vectorstores import Chroma

def create_vector_database(chunks):
    """Create a vector database from manual chunks."""
    # Initialize embedding model
    embeddings = OpenAIEmbeddings()
    
    # Prepare texts and metadata
    texts = [chunk["content"] for chunk in chunks]
    metadatas = [{
        "title": chunk["title"],
        "level": chunk["level"],
        "path": chunk["path"]
    } for chunk in chunks]
    
    # Create vector database
    vectordb = Chroma.from_texts(
        texts=texts,
        embedding=embeddings,
        metadatas=metadatas,
        persist_directory="./manual_db"
    )
    
    return vectordb
```

### 3. Retrieval System Implementation

```python
# Example code for retrieving relevant manual sections
from langchain.retrievers import ContextualCompressionRetriever
from langchain.retrievers.document_compressors import LLMChainExtractor

def setup_retriever(vectordb):
    """Set up a retrieval system with contextual compression."""
    # Basic retriever
    basic_retriever = vectordb.as_retriever(
        search_type="similarity",
        search_kwargs={"k": 5}
    )
    
    # LLM for contextual compression
    llm = ChatOpenAI(temperature=0)
    
    # Compressor that uses LLM to extract relevant information
    compressor = LLMChainExtractor.from_llm(llm)
    
    # Create the contextual compression retriever
    compression_retriever = ContextualCompressionRetriever(
        base_compressor=compressor,
        base_retriever=basic_retriever
    )
    
    return compression_retriever
```

### 4. Chatbot Agent Implementation

```python
# Example code for the chatbot agent with manual integration
from langchain.agents import Tool
from langchain.agents import AgentExecutor
from langchain.agents.openai_functions_agent.base import OpenAIFunctionsAgent
from langchain.prompts import MessagesPlaceholder
from langchain.memory import ConversationBufferMemory
from langchain.schema.messages import SystemMessage

def create_manual_integrated_agent(retriever):
    """Create a chatbot agent with manual integration."""
    # Define the tool for searching the manual
    manual_tool = Tool(
        name="search_manual",
        description="Search the STRIKE user manual for information",
        func=lambda query: retriever.get_relevant_documents(query)
    )
    
    # System message that instructs the agent about the manual
    system_message = SystemMessage(
        content="""You are the STRIKE CRM assistant. You have access to the STRIKE user manual.
        When users ask questions about how to use STRIKE, search the manual for relevant information.
        Always cite the specific section of the manual you're referencing.
        If you're guiding users through a multi-step process, check their progress at each step."""
    )
    
    # Create the agent with the manual tool
    llm = ChatOpenAI(temperature=0)
    
    # Set up memory
    memory = ConversationBufferMemory(
        memory_key="chat_history",
        return_messages=True
    )
    
    # Create the agent
    agent = OpenAIFunctionsAgent.from_llm_and_tools(
        llm=llm,
        tools=[manual_tool],
        system_message=system_message,
        extra_prompt_messages=[
            MessagesPlaceholder(variable_name="chat_history")
        ]
    )
    
    # Create the agent executor
    agent_executor = AgentExecutor.from_agent_and_tools(
        agent=agent,
        tools=[manual_tool],
        memory=memory,
        verbose=True
    )
    
    return agent_executor
```

### 5. Natural Language to SQL Implementation

```python
# Example code for converting natural language to SQL queries
from langchain.chains import LLMChain
from langchain.prompts import PromptTemplate
from langchain.chat_models import ChatOpenAI
from langchain.output_parsers import StrOutputParser
from langchain.prompts import ChatPromptTemplate

class NLToSQLConverter:
    """Convert natural language questions to SQL queries."""
    
    def __init__(self, db_schema, openai_api_key):
        """Initialize with database schema and API key."""
        self.db_schema = db_schema
        self.openai_api_key = openai_api_key
        self.llm = ChatOpenAI(
            api_key=openai_api_key,
            model_name="gpt-4",
            temperature=0,
        )
    
    def create_schema_prompt(self):
        """Create a prompt with the database schema."""
        schema_description = ""
        for table, columns in self.db_schema.items():
            schema_description += f"- {table}: {', '.join(columns)}\n"
        
        return schema_description
    
    def convert_to_sql(self, natural_language_query):
        """Convert natural language query to SQL."""
        schema_prompt = self.create_schema_prompt()
        
        sql_generation_prompt = ChatPromptTemplate.from_messages([
            ("system", f"""
            You are a SQL expert. Generate a SQL query to answer the user's question.
            
            The database has the following tables and columns:
            {schema_prompt}
            
            Generate ONLY a SQL SELECT query. Do not include any explanations or comments.
            Only return the SQL query itself. Ensure the query is secure and follows best practices.
            """),
            ("human", natural_language_query),
        ])
        
        chain = sql_generation_prompt | self.llm | StrOutputParser()
        sql_query = chain.invoke({})
        
        return self.sanitize_query(sql_query)
    
    def sanitize_query(self, query):
        """Sanitize the SQL query for security."""
        # Check if query is SELECT only
        if not query.strip().lower().startswith("select"):
            return None
        
        # Check for dangerous operations
        dangerous_keywords = ["insert", "update", "delete", "drop", "alter", "create", "truncate"]
        if any(keyword in query.lower() for keyword in dangerous_keywords):
            return None
        
        return query
    
    async def execute_query(self, query, db_connection):
        """Execute the SQL query and return results."""
        if not query:
            return {"error": "Invalid query. Only SELECT statements are allowed."}
        
        try:
            # Execute query using your database connection
            # This is a placeholder - implement according to your DB system
            results = await db_connection.execute(query)
            return {"results": results}
        except Exception as e:
            return {"error": str(e)}
```

### 6. Database Query Tool Implementation

```python
from langchain.tools import BaseTool
import json
import logging

logger = logging.getLogger(__name__)

class DatabaseQueryTool(BaseTool):
    """Tool for querying the database using natural language."""
    name = "database_query"
    description = "Query the database to retrieve information. Use this when you need to look up specific data."
    
    def __init__(self, nl_to_sql_converter, db_connection):
        """Initialize with NL to SQL converter and DB connection."""
        super().__init__()
        self.converter = nl_to_sql_converter
        self.db_connection = db_connection
    
    async def _arun(
        self,
        query: str,
        run_manager = None,
    ) -> str:
        """Run the database query asynchronously."""
        try:
            # Convert natural language to SQL
            sql_query = self.converter.convert_to_sql(query)
            
            if not sql_query:
                return "I cannot perform this operation. Only data retrieval queries are allowed."
            
            # Execute the query
            results = await self.converter.execute_query(sql_query, self.db_connection)
            
            if "error" in results:
                return f"Error executing query: {results['error']}"
            
            # Format the results as a string
            if not results["results"]:
                return "No results found."
            
            # Convert results to a readable format
            formatted_results = json.dumps(results["results"], indent=2, default=str)
            return f"Query results:\n{formatted_results}"
        except Exception as e:
            logger.error(f"Database query error: {e}")
            return f"Error executing query: {str(e)}"
```

### 7. Query Classification Implementation

```python
from enum import Enum

class QueryType(Enum):
    DATABASE_QUERY = "database_query"
    MANUAL_REFERENCE = "manual_reference"
    GENERAL_QUESTION = "general_question"
    TASK_EXECUTION = "task_execution"

async def classify_query(query_text, llm):
    """Classify the type of query being asked."""
    classification_prompt = ChatPromptTemplate.from_messages([
        ("system", """
        Classify the user's query into one of the following categories:
        1. DATABASE_QUERY - Questions asking for specific data from the CRM database
        2. MANUAL_REFERENCE - Questions about how to use the system or reference to the manual
        3. GENERAL_QUESTION - General questions not requiring database access or manual reference
        4. TASK_EXECUTION - Requests to perform a specific action in the system
        
        Respond with only the category name.
        """),
        ("human", query_text),
    ])
    
    chain = classification_prompt | llm | StrOutputParser()
    query_type = chain.invoke({})
    
    try:
        return QueryType[query_type.strip()]
    except (KeyError, ValueError):
        # Default to general question if classification fails
        return QueryType.GENERAL_QUESTION
```

### 8. User Context Tracking

```python
# Example code for tracking user context
class UserContextTracker:
    """Track user context for providing relevant manual sections."""
    
    def __init__(self):
        self.current_page = None
        self.current_section = None
        self.tutorial_progress = {}
    
    def update_page_context(self, page_name):
        """Update the current page the user is viewing."""
        self.current_page = page_name
        
    def update_section_context(self, section_name):
        """Update the current section the user is interacting with."""
        self.current_section = section_name
    
    def start_tutorial(self, tutorial_id, total_steps):
        """Start a new tutorial and track progress."""
        self.tutorial_progress[tutorial_id] = {
            "current_step": 1,
            "total_steps": total_steps,
            "completed_steps": []
        }
    
    def advance_tutorial(self, tutorial_id):
        """Advance to the next step in a tutorial."""
        if tutorial_id in self.tutorial_progress:
            progress = self.tutorial_progress[tutorial_id]
            progress["completed_steps"].append(progress["current_step"])
            progress["current_step"] += 1
            return progress["current_step"] <= progress["total_steps"]
        return False
    
    def get_relevant_manual_sections(self):
        """Get manual sections relevant to current context."""
        relevant_sections = []
        if self.current_page:
            relevant_sections.append(f"page:{self.current_page}")
        if self.current_section:
            relevant_sections.append(f"section:{self.current_section}")
        return relevant_sections
```

### 9. Frontend Integration

```javascript
// Example code for frontend integration
class ChatbotManualIntegration {
  constructor() {
    this.chatWidget = document.getElementById('chat-widget');
    this.currentPage = window.location.pathname;
    this.currentSection = null;
    this.isMinimized = false;
    this.isAnimating = false;
    
    // Initialize event listeners
    this.initEventListeners();
  }
  
  initEventListeners() {
    // Track page navigation
    window.addEventListener('popstate', () => {
      this.updatePageContext(window.location.pathname);
    });
    
    // Track section interaction
    document.querySelectorAll('[data-section]').forEach(element => {
      element.addEventListener('click', () => {
        this.updateSectionContext(element.dataset.section);
      });
    });
  }
  
  updatePageContext(pagePath) {
    this.currentPage = pagePath;
    // Send to backend
    fetch('/api/chatbot/context', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ page: pagePath })
    });
  }
  
  updateSectionContext(sectionName) {
    this.currentSection = sectionName;
    // Send to backend
    fetch('/api/chatbot/context', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ section: sectionName })
    });
  }
  
  // Method to display manual content in chat
  displayManualContent(content, sourceSection) {
    const messageElement = document.createElement('div');
    messageElement.className = 'manual-content';
    
    // Create citation
    const citation = document.createElement('div');
    citation.className = 'manual-citation';
    citation.textContent = `Source: ${sourceSection}`;
    
    // Create content
    const contentElement = document.createElement('div');
    contentElement.innerHTML = marked(content); // Using marked.js to render markdown
    
    // Add interactive elements if needed
    this.addInteractiveElements(contentElement);
    
    // Assemble message
    messageElement.appendChild(contentElement);
    messageElement.appendChild(citation);
    
    // Add to chat
    this.chatWidget.querySelector('.messages').appendChild(messageElement);
  }
  
  // Add interactive elements to manual content
  addInteractiveElements(contentElement) {
    // Convert steps to interactive checkboxes
    contentElement.querySelectorAll('ol li, ul li').forEach((item, index) => {
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = `step-${index}`;
      checkbox.addEventListener('change', () => {
        if (checkbox.checked) {
          this.completeStep(index);
        }
      });
      
      item.prepend(checkbox);
    });
    
    // Make headings collapsible
    contentElement.querySelectorAll('h3, h4, h5, h6').forEach(heading => {
      heading.classList.add('collapsible');
      heading.addEventListener('click', () => {
        heading.classList.toggle('collapsed');
        let content = heading.nextElementSibling;
        while (content && !content.tagName.match(/^H[1-6]$/)) {
          content.classList.toggle('hidden');
          content = content.nextElementSibling;
        }
      });
    });
  }
  
  // Track tutorial progress
  completeStep(stepIndex) {
    fetch('/api/chatbot/tutorial-progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        step: stepIndex,
        tutorial: this.currentTutorial
      })
    });
  }
  
  // Handle minimize functionality
  handleMinimize() {
    // Start animation
    this.isAnimating = true;
    
    // Add animation classes
    this.chatWidget.classList.add('minimizing');
    
    // After animation completes, toggle visibility
    setTimeout(() => {
      this.isMinimized = true;
      this.chatWidget.classList.add('minimized');
      this.chatWidget.classList.remove('minimizing');
      
      // Show the chat icon
      document.getElementById('chat-icon').style.display = 'block';
      
      // Hide the chat window
      this.chatWidget.style.display = 'none';
      
      this.isAnimating = false;
    }, 300); // Match animation duration
  }
  
  // Handle maximize/restore functionality
  handleMaximize() {
    // Show the chat window
    this.chatWidget.style.display = 'flex';
    
    // Hide the chat icon
    document.getElementById('chat-icon').style.display = 'none';
    
    // Start animation
    this.isAnimating = true;
    this.chatWidget.classList.add('maximizing');
    
    // After animation completes, update state
    setTimeout(() => {
      this.isMinimized = false;
      this.chatWidget.classList.remove('minimized');
      this.chatWidget.classList.remove('maximizing');
      this.isAnimating = false;
    }, 300);
  }
}

// CSS for animations
/*
.minimizing {
  animation: fadeOut 0.3s ease-in-out;
  opacity: 0;
  transform: scale(0.8);
}

.maximizing {
  animation: fadeIn 0.3s ease-in-out;
  opacity: 1;
  transform: scale(1);
}

@keyframes fadeOut {
  from { opacity: 1; transform: scale(1); }
  to { opacity: 0; transform: scale(0.8); }
}

@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.8); }
  to { opacity: 1; transform: scale(1); }
}

#chat-icon {
  animation: popIn 0.3s ease-in-out;
}

@keyframes popIn {
  from { transform: scale(0.5); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
*/

// Initialize the integration
document.addEventListener('DOMContentLoaded', () => {
  window.chatbotManualIntegration = new ChatbotManualIntegration();
});
```

## Deployment Considerations

### 1. Manual Content Updates

Set up a CI/CD pipeline to:
- Process manual updates automatically
- Regenerate embeddings when content changes
- Version control the manual content
- Track changes for chatbot reference

### 2. Performance Optimization

- Implement caching for frequently accessed manual sections
- Use chunking strategies to optimize retrieval
- Consider pre-computing embeddings for all manual content
- Implement pagination for long manual sections

### 3. User Feedback Loop

- Track which manual sections are most frequently accessed
- Collect user ratings on the helpfulness of responses
- Identify gaps in manual content based on unanswered questions
- Use analytics to improve manual content and organization

### 4. Security Considerations

- Ensure proper authentication for admin-level manual content
- Implement rate limiting to prevent abuse
- Sanitize user input to prevent injection attacks
- Consider privacy implications of tracking user context

## Testing Strategy

1. **Unit Tests**: Test individual components (parsing, embedding, retrieval)
2. **Integration Tests**: Test the full pipeline from query to response
3. **User Acceptance Testing**: Have real users test the system with common queries
4. **Performance Testing**: Measure response times and optimize as needed
5. **A/B Testing**: Compare different retrieval strategies for effectiveness

## Monitoring and Analytics

Implement monitoring for:
- Query success rate (% of queries that find relevant manual content)
- User satisfaction metrics
- Response time
- Most common queries
- Manual sections that need improvement

## Future Enhancements

1. **Multilingual Support**: Translate the manual and support queries in multiple languages
2. **Voice Interface**: Allow voice queries about manual content
3. **Personalized Help**: Tailor responses based on user role and experience level
4. **Predictive Assistance**: Anticipate user needs based on their behavior
5. **Interactive Tutorials**: Create guided walkthroughs with interactive elements 