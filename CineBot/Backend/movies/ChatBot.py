# movies/chatbot.py
import os
import requests
from django.conf import settings

class MovieChatbot:
    def __init__(self, user=None):
        self.user = user
        self.cohere_api_key = settings.COHERE_API_KEY
        self.cohere_api_url = "https://api.cohere.ai/v1/chat"
    
    def generate_response(self, message, conversation_history=None):
        """Generate a response using Cohere API that only answers movie-related questions"""
        
        # If no conversation history is provided, initialize it
        if conversation_history is None:
            conversation_history = []
        
        # Prepare the system prompt to ensure the bot only answers movie-related questions
        system_prompt = """
        You are MovieMind, a specialized AI assistant that only answers questions related to movies, TV shows, 
        actors, directors, film history, and cinema. You can provide information about:
        
        - Movie recommendations, plots, cast, and crew
        - Directors, actors, and their filmographies
        - Film history and trivia
        - Movie genres and styles
        - TV shows and series
        - Film reviews and ratings
        - Upcoming releases and movie news
        - Film theory and analysis
        
        If a user asks a question that is not related to movies or cinema in any way, 
        politely inform them that you can only help with movie-related topics and 
        provide examples of questions you can answer.
        
        Always maintain a friendly, knowledgeable tone like a film enthusiast.
        """
        
        # Format the conversation history
        # Convert 'user' and 'assistant' roles to 'User' and 'Chatbot' as required by Cohere API
        formatted_history = []
        for msg in conversation_history:
            role = msg.get("role", "user")
            # Convert roles to match Cohere API requirements
            if role.lower() == "user":
                cohere_role = "User"
            elif role.lower() == "assistant":
                cohere_role = "Chatbot"
            else:
                cohere_role = "User"  # Default to User if unknown
            
            formatted_history.append({
                "role": cohere_role,
                "message": msg.get("message", "")
            })
        
        # Prepare the request
        headers = {
            "Authorization": f"Bearer {self.cohere_api_key}",
            "Content-Type": "application/json"
        }
        
        data = {
            "message": message,
            "model": "command",  # Or another appropriate Cohere model
            "chat_history": formatted_history,
            "preamble": system_prompt,
            "temperature": 0.7,
            "max_tokens": 500
        }
        
        try:
            # Make the API request to Cohere
            response = requests.post(self.cohere_api_url, headers=headers, json=data)
            
            if response.status_code == 200:
                # Extract response from Cohere
                result = response.json()
                return result.get("text", "I'm having trouble providing information right now. Please try again later.")
            else:
                print(f"Error from Cohere API: {response.status_code} - {response.text}")
                return "I'm having trouble connecting to my movie database right now. Please try again later."
        
        except Exception as e:
            print(f"Exception when calling Cohere API: {str(e)}")
            return "Sorry, I encountered an error while searching for movie information. Please try again later."