"""
Chatbot Agent for the AI-powered CRM.

This module implements a LangGraph-based chatbot agent that can answer questions about
the CRM application, query the database, suggest troubleshooting steps, and learn from
user interactions.
"""

import logging
import json
from typing import Dict, List, Any, Optional, Tuple, Annotated, TypedDict, Literal, cast
from uuid import UUID, uuid4
from datetime import datetime
import os
from pathlib import Path

from langchain.schema import HumanMessage, AIMessage, SystemMessage
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.chat_models import ChatOpenAI
from langchain.tools import BaseTool
from langchain_core.messages import BaseMessage
from langchain_core.runnables import RunnableConfig
from langchain_core.output_parsers import StrOutputParser
from langchain.callbacks.manager import CallbackManagerForToolRun
from langchain_community.tools.sql_database.tool import QuerySQLDataBaseTool
from langchain_community.utilities.sql_database import SQLDatabase
from langchain.embeddings import OpenAIEmbeddings
from langchain.vectorstores import FAISS
from langchain.text_splitter import MarkdownTextSplitter
from langchain.chains import RetrievalQA

import langgraph
from langgraph.graph import StateGraph, END
from langgraph_prebuilt import ToolNode, tools_condition

from app.core.config import settings
from app.core.database import execute_raw_sql
from app.models.chatbot import (
    ChatMessage, ChatMessageRole, ChatSession, ChatRequest, 
    ChatResponse, ChatFeedback, ChatbotQueryType
)
from app.agents.base import AgentState, create_llm, create_system_message, create_human_message

# Configure logger
logger = logging.getLogger(__name__)

# Add this constant at the top of the file
DOCUMENTATION_PATH = Path(__file__).parent.parent / "data" / "documentation.md"

# Type definitions for the chatbot agent
class ChatbotState(TypedDict):
    """State for the chatbot agent"""
    messages: List[BaseMessage]
    session_id: UUID
    user_id: Optional[UUID]
    query_type: Optional[ChatbotQueryType]
    db_results: Optional[List[Dict[str, Any]]]
    current_response: Optional[str]
    feedback: Optional[Dict[str, Any]]
    suggested_follow_ups: Optional[List[str]]
    sources: Optional[List[Dict[str, Any]]]
    metadata: Dict[str, Any]

# System prompts
CHATBOT_SYSTEM_PROMPT = """
You are an AI assistant for an AI-powered CRM system. Your role is to help users with:

1. Answering questions about the CRM application functionality
2. Querying the database to provide information (when appropriate)
3. Suggesting troubleshooting steps for common issues
4. Answering frequently asked questions

The CRM system has the following main features:
- Lead management (tracking leads, scoring, status updates)
- Task management (creating, assigning, and tracking tasks)
- Communication tracking (emails, calls, SMS)
- Meeting scheduling and management
- Campaign management
- Analytics and reporting
- AI-powered insights and recommendations

When answering questions:
- Be concise and helpful
- If you need to query the database, use the database_query tool
- If you're unsure about something, be honest about your limitations
- Suggest follow-up questions when appropriate
- Format your responses using markdown for better readability

Remember that you can only access public data and should never expose sensitive information.
"""

FAQ_KNOWLEDGE = """
Frequently Asked Questions:

Q: How do I reset my password?
A: You can reset your password by clicking on the "Forgot Password" link on the login page. You'll receive an email with instructions to create a new password.

Q: How do I create a new lead?
A: To create a new lead, go to the Leads section and click the "Add Lead" button. Fill in the required information and click "Save".

Q: How do I assign a task to another team member?
A: When creating or editing a task, use the "Assigned To" dropdown to select the team member you want to assign the task to.

Q: How do I track email communications with leads?
A: The system automatically tracks emails when you use the built-in email tool. You can also manually log emails by going to a lead's profile and clicking "Log Activity" > "Email".

Q: How does the lead scoring system work?
A: The lead scoring system uses AI to analyze various factors including email engagement, response time, communication frequency, sentiment analysis, and more to assign a score from 0-100 to each lead.

Q: How can I export my leads data?
A: Go to the Leads section, use filters to select the leads you want to export, then click the "Export" button and choose your preferred format (CSV or Excel).

Q: How do I create a new campaign?
A: Go to the Campaigns section and click "Create Campaign". Fill in the campaign details, select your target leads, and set up the campaign sequence.

Q: How can I see my team's performance?
A: Go to the Analytics section where you can view dashboards showing team performance metrics, lead conversion rates, and other key indicators.

Q: How do I integrate with other tools?
A: Go to Settings > Integrations to set up connections with email providers, calendar apps, and other third-party tools.

Q: Is my data secure?
A: Yes, we use industry-standard encryption and security practices to protect your data. All information is stored securely and access is strictly controlled.
"""

TROUBLESHOOTING_KNOWLEDGE = """
Common Troubleshooting Issues:

1. Email Integration Issues:
   - Check that your email credentials are correct in Settings > Integrations
   - Ensure you've granted the necessary permissions
   - Try disconnecting and reconnecting the integration
   - Check if your email provider has any security settings blocking the connection

2. Import/Export Problems:
   - Ensure your CSV file follows the required format
   - Check for special characters that might cause parsing issues
   - For large imports, try breaking the file into smaller batches
   - Make sure required fields are included in your import file

3. Performance Issues:
   - Clear your browser cache and cookies
   - Try using a different browser
   - Check your internet connection
   - If using filters, try reducing the complexity of your queries

4. Missing Data:
   - Check if filters are applied that might be hiding data
   - Verify you have the correct permissions to view the data
   - Check if the data was archived (Settings > Data Management)
   - Ensure all required fields were filled when creating records

5. Notification Issues:
   - Check your notification settings (User Profile > Notifications)
   - Verify your email address is correct
   - Check your email spam folder
   - Ensure notifications are enabled for your user role

6. Mobile App Problems:
   - Ensure you're using the latest version of the app
   - Try logging out and logging back in
   - Check if your device meets the minimum requirements
   - Verify you have a stable internet connection

7. Report Generation Errors:
   - Try selecting a smaller date range
   - Reduce the complexity of the report
   - Check if you have the necessary permissions
   - Try generating the report during off-peak hours

8. Calendar Sync Issues:
   - Verify your calendar integration is properly connected
   - Check for conflicting events
   - Ensure you've granted the necessary calendar permissions
   - Try removing and re-adding the calendar integration
"""

class DatabaseQueryTool(BaseTool):
    """Tool for querying the database"""
    name = "database_query"
    description = "Query the database to retrieve information. Use this when you need to look up specific data."
    
    async def _arun(
        self,
        query: str,
        run_manager: Optional[CallbackManagerForToolRun] = None,
    ) -> str:
        """Run the database query asynchronously."""
        try:
            # Sanitize and validate the query to prevent SQL injection
            # This is a simplified version - in production, you'd want more robust validation
            if any(keyword in query.lower() for keyword in ["insert", "update", "delete", "drop", "alter", "create"]):
                return "Error: Only SELECT queries are allowed for security reasons."
            
            # Execute the query
            results = await execute_raw_sql(query)
            
            # Format the results as a string
            if not results:
                return "No results found."
            
            # Convert results to a readable format
            formatted_results = json.dumps(results, indent=2, default=str)
            return f"Query results:\n{formatted_results}"
        except Exception as e:
            logger.error(f"Database query error: {e}")
            return f"Error executing query: {str(e)}"

def classify_query(state: ChatbotState) -> ChatbotState:
    """Classify the type of query being asked."""
    messages = state["messages"]
    
    # Get the latest user message
    latest_message = messages[-1].content if messages else ""
    
    # Use LLM to classify the query type
    llm = ChatOpenAI(
        api_key=settings.OPENAI_API_KEY,
        model_name=settings.DEFAULT_MODEL,
        temperature=0,
    )
    
    classification_prompt = ChatPromptTemplate.from_messages([
        ("system", """
        Classify the user query into one of the following categories:
        - APP_FUNCTIONALITY: Questions about how to use the CRM application
        - DATABASE_QUERY: Requests for specific data from the database
        - TROUBLESHOOTING: Help with solving problems or errors
        - FAQ: Common questions about the system
        - GENERAL: General questions or chitchat
        
        Respond with just the category name.
        """),
        ("human", latest_message),
    ])
    
    chain = classification_prompt | llm | StrOutputParser()
    query_type_str = chain.invoke({})
    
    # Map the string to the enum
    query_type_map = {
        "APP_FUNCTIONALITY": ChatbotQueryType.APP_FUNCTIONALITY,
        "DATABASE_QUERY": ChatbotQueryType.DATABASE_QUERY,
        "TROUBLESHOOTING": ChatbotQueryType.TROUBLESHOOTING,
        "FAQ": ChatbotQueryType.FAQ,
        "GENERAL": ChatbotQueryType.GENERAL,
    }
    
    query_type = query_type_map.get(query_type_str.strip(), ChatbotQueryType.GENERAL)
    
    # Update the state with the query type
    state["query_type"] = query_type
    
    return state

def generate_db_query(state: ChatbotState) -> ChatbotState:
    """Generate a database query based on the user's question."""
    if state["query_type"] != ChatbotQueryType.DATABASE_QUERY:
        # Skip if this is not a database query
        return state
    
    messages = state["messages"]
    latest_message = messages[-1].content if messages else ""
    
    # Use LLM to generate a SQL query
    llm = ChatOpenAI(
        api_key=settings.OPENAI_API_KEY,
        model_name=settings.DEFAULT_MODEL,
        temperature=0,
    )
    
    sql_generation_prompt = ChatPromptTemplate.from_messages([
        ("system", """
        You are a SQL expert. Generate a SQL query to answer the user's question.
        
        The database has the following main tables:
        - users: User accounts (id, email, name, role, team_id)
        - teams: Teams (id, name, settings)
        - leads: Sales leads (id, first_name, last_name, email, phone, company, status, owner_id, team_id, lead_score)
        - tasks: Tasks assigned to users (id, title, description, due_date, status, priority, assigned_to, lead_id)
        - emails: Email communications (id, subject, body, sender, recipient, lead_id, user_id)
        - calls: Phone call records (id, duration, notes, lead_id, user_id)
        - meetings: Meeting records (id, title, description, start_time, end_time, lead_id, user_id)
        - campaigns: Marketing campaigns (id, name, description, status, start_date, end_date, team_id)
        
        Generate ONLY a SQL SELECT query. Do not include any explanations or comments.
        Only return the SQL query itself.
        """),
        ("human", latest_message),
    ])
    
    chain = sql_generation_prompt | llm | StrOutputParser()
    sql_query = chain.invoke({})
    
    # Execute the query
    try:
        db_tool = DatabaseQueryTool()
        results = db_tool._run(sql_query)
        state["db_results"] = results
    except Exception as e:
        logger.error(f"Error executing generated SQL query: {e}")
        state["db_results"] = f"Error executing query: {str(e)}"
    
    return state

def load_documentation():
    """Load and index the documentation for retrieval."""
    if not os.path.exists(DOCUMENTATION_PATH):
        logger.warning(f"Documentation file not found at {DOCUMENTATION_PATH}")
        return None
    
    # Load the documentation
    with open(DOCUMENTATION_PATH, "r") as f:
        documentation = f.read()
    
    # Split the documentation into chunks
    text_splitter = MarkdownTextSplitter(chunk_size=1000, chunk_overlap=100)
    chunks = text_splitter.split_text(documentation)
    
    # Create embeddings
    embeddings = OpenAIEmbeddings(api_key=settings.OPENAI_API_KEY)
    
    # Create a vector store
    vectorstore = FAISS.from_texts(chunks, embeddings)
    
    return vectorstore

def generate_response(state: ChatbotState) -> ChatbotState:
    """Generate a response based on the query type and available information."""
    messages = state["messages"]
    query_type = state["query_type"]
    db_results = state.get("db_results")
    
    # Create a prompt based on the query type
    system_prompt = CHATBOT_SYSTEM_PROMPT
    
    # Add specific knowledge based on query type
    if query_type == ChatbotQueryType.FAQ:
        system_prompt += "\n\n" + FAQ_KNOWLEDGE
    elif query_type == ChatbotQueryType.TROUBLESHOOTING:
        system_prompt += "\n\n" + TROUBLESHOOTING_KNOWLEDGE
    
    # Add database results if available
    db_context = ""
    if db_results:
        db_context = f"\n\nDatabase query results:\n{db_results}\n\n"
    
    # Get relevant documentation if available
    doc_context = ""
    latest_message = messages[-1].content if messages else ""
    
    # Get the chatbot agent instance to access the documentation index
    agent = get_chatbot_agent()
    if agent.documentation_index:
        # Create a retriever
        retriever = agent.documentation_index.as_retriever(search_kwargs={"k": 3})
        
        # Get relevant documentation chunks
        docs = retriever.get_relevant_documents(latest_message)
        
        if docs:
            doc_context = "\n\nRelevant documentation:\n"
            for i, doc in enumerate(docs):
                doc_context += f"Document {i+1}:\n{doc.page_content}\n\n"
    
    # Create the prompt
    prompt = ChatPromptTemplate.from_messages([
        ("system", system_prompt + db_context + doc_context),
        MessagesPlaceholder(variable_name="chat_history"),
        ("human", "{input}"),
    ])
    
    # Create the LLM
    llm = ChatOpenAI(
        api_key=settings.OPENAI_API_KEY,
        model_name=settings.DEFAULT_MODEL,
        temperature=0.7,
    )
    
    # Create the chain
    chain = prompt | llm | StrOutputParser()
    
    # Prepare the chat history
    chat_history = []
    for msg in messages[:-1]:  # Exclude the latest message which is the input
        if isinstance(msg, HumanMessage):
            chat_history.append(("human", msg.content))
        elif isinstance(msg, AIMessage):
            chat_history.append(("ai", msg.content))
    
    # Generate the response
    response = chain.invoke({
        "chat_history": chat_history,
        "input": messages[-1].content if messages else "",
    })
    
    # Update the state
    state["current_response"] = response
    
    # Generate suggested follow-up questions
    follow_up_prompt = ChatPromptTemplate.from_messages([
        ("system", """
        Based on the conversation so far and the assistant's response, suggest 3 follow-up questions 
        that the user might want to ask next. Return them as a JSON array of strings.
        Example: ["How do I create a new lead?", "Can I export my data?", "How does lead scoring work?"]
        """),
        MessagesPlaceholder(variable_name="chat_history"),
        ("human", "Assistant's response: {response}"),
    ])
    
    follow_up_chain = follow_up_prompt | llm
    follow_up_response = follow_up_chain.invoke({
        "chat_history": chat_history + [("human", messages[-1].content if messages else "")],
        "response": response,
    })
    
    # Parse the follow-up questions
    try:
        # Extract JSON array from the response
        import re
        json_match = re.search(r'\[.*\]', follow_up_response.content, re.DOTALL)
        if json_match:
            json_str = json_match.group(0)
            suggested_follow_ups = json.loads(json_str)
            state["suggested_follow_ups"] = suggested_follow_ups
        else:
            state["suggested_follow_ups"] = []
    except Exception as e:
        logger.error(f"Error parsing follow-up questions: {e}")
        state["suggested_follow_ups"] = []
    
    return state

def process_feedback(state: ChatbotState) -> ChatbotState:
    """Process user feedback on the response."""
    feedback = state.get("feedback")
    if not feedback:
        return state
    
    # In a real implementation, you would store this feedback in a database
    # and use it to improve the model over time
    logger.info(f"Received feedback: {feedback}")
    
    # You could also use this feedback to adjust the response in real-time
    # For now, we'll just acknowledge the feedback
    if feedback.get("type") == "not_helpful":
        # If the user found the response not helpful, we could try to generate a better one
        # This is a simplified example
        state["current_response"] += "\n\nI apologize if my response wasn't helpful. Could you please provide more details about what you're looking for?"
    
    return state

def get_tools():
    """Get the tools for the chatbot agent."""
    return [DatabaseQueryTool()]

def create_chatbot_agent():
    """Create the chatbot agent graph."""
    # Define the state
    state = cast(ChatbotState, {
        "messages": [],
        "session_id": uuid4(),
        "user_id": None,
        "query_type": None,
        "db_results": None,
        "current_response": None,
        "feedback": None,
        "suggested_follow_ups": None,
        "sources": None,
        "metadata": {},
    })
    
    # Create the graph
    workflow = StateGraph(state)
    
    # Add nodes
    workflow.add_node("classify_query", classify_query)
    workflow.add_node("generate_db_query", generate_db_query)
    workflow.add_node("generate_response", generate_response)
    workflow.add_node("process_feedback", process_feedback)
    
    # Add tools node
    tools = get_tools()
    workflow.add_node("tools", ToolNode(tools))
    
    # Add edges
    workflow.add_edge("classify_query", "generate_db_query")
    workflow.add_edge("generate_db_query", "generate_response")
    workflow.add_edge("generate_response", "process_feedback")
    workflow.add_edge("process_feedback", END)
    
    # Add conditional edge for tools
    workflow.add_conditional_edges(
        "generate_response",
        tools_condition,
        {
            tool.name: "tools" for tool in tools
        },
    )
    workflow.add_edge("tools", "generate_response")
    
    # Set the entry point
    workflow.set_entry_point("classify_query")
    
    # Compile the graph
    return workflow.compile()

class ChatbotAgent:
    """Chatbot agent for the CRM system."""
    
    def __init__(self):
        """Initialize the chatbot agent."""
        self.agent = create_chatbot_agent()
        self.sessions = {}  # In-memory storage for sessions
        self.documentation_index = load_documentation()
    
    async def process_message(self, request: ChatRequest) -> ChatResponse:
        """Process a message from the user."""
        # Get or create a session
        session_id = request.session_id or uuid4()
        if session_id not in self.sessions:
            self.sessions[session_id] = {
                "messages": [],
                "metadata": {},
            }
        
        # Add the user message to the session
        user_message = HumanMessage(content=request.message)
        self.sessions[session_id]["messages"].append(user_message)
        
        # Prepare the state
        state = {
            "messages": self.sessions[session_id]["messages"],
            "session_id": session_id,
            "user_id": request.user_id,
            "query_type": None,
            "db_results": None,
            "current_response": None,
            "feedback": None,
            "suggested_follow_ups": None,
            "sources": None,
            "metadata": request.metadata or {},
        }
        
        # Process the message
        result = await self.agent.ainvoke(state)
        
        # Extract the response
        response_text = result["current_response"]
        suggested_follow_ups = result.get("suggested_follow_ups", [])
        
        # Add the assistant message to the session
        assistant_message = AIMessage(content=response_text)
        self.sessions[session_id]["messages"].append(assistant_message)
        
        # Create the response
        response = ChatResponse(
            session_id=session_id,
            message=response_text,
            suggested_follow_ups=suggested_follow_ups,
            metadata={
                "query_type": result.get("query_type", ChatbotQueryType.GENERAL).value,
            },
        )
        
        return response
    
    async def provide_feedback(self, feedback: ChatFeedback) -> Dict[str, Any]:
        """Process feedback from the user."""
        # In a real implementation, you would store this feedback in a database
        # and use it to improve the model over time
        session_id = feedback.session_id
        if session_id not in self.sessions:
            return {"status": "error", "message": "Session not found"}
        
        # Process the feedback
        state = {
            "messages": self.sessions[session_id]["messages"],
            "session_id": session_id,
            "user_id": feedback.user_id,
            "query_type": None,
            "db_results": None,
            "current_response": None,
            "feedback": {
                "type": feedback.feedback_type,
                "comment": feedback.comment,
            },
            "suggested_follow_ups": None,
            "sources": None,
            "metadata": {},
        }
        
        # Process the feedback
        result = await self.agent.ainvoke(state, {"nodes_to_execute": ["process_feedback"]})
        
        return {"status": "success", "message": "Feedback received"}

# Add this global variable and function
_chatbot_agent = None

def get_chatbot_agent() -> ChatbotAgent:
    """Get or create the chatbot agent singleton instance."""
    global _chatbot_agent
    if _chatbot_agent is None:
        _chatbot_agent = ChatbotAgent()
    return _chatbot_agent 