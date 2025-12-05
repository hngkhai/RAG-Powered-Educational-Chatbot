import logging
import os
from typing import Dict, Any

# LangChain & Gemini Imports
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser
from langchain_core.messages import HumanMessage, SystemMessage

from helper.file_retrieval import retrieve_file_by_id, extract_text_from_pdf, create_vector_store, search_chunks

def run_application(mongo_uri: str, db_name: str, file_id: str, query: str, api_key):
    file_stream, filename = retrieve_file_by_id(mongo_uri, db_name, file_id)
    if not file_stream:
        logging.error("Failed to retrieve the file.")
        return {"error": "Failed to retrieve the file."}

    logging.info(f"Extracting text from file: {filename}")
    documents = extract_text_from_pdf(file_stream)
    logging.info(f"Extracted {len(documents)} documents from PDF.")

    faissDB = create_vector_store(documents, api_key)
    if not faissDB:
        logging.error("Failed to create FAISS vector store.")
        return {"error": "Failed to create FAISS vector store."}

    retriever = faissDB.as_retriever(
        search_type="similarity_score_threshold",
        search_kwargs={"k": 10,'score_threshold': 0.1}
    )

    llm = ChatGoogleGenerativeAI(
        model="gemini-2.0-flash",
        temperature=0,
        max_tokens=None,
        timeout=None,
        max_retries=1,
        google_api_key=api_key)
    
    retrieval_context = search_chunks(retriever, query)
    # sysmsg = f"""
    # You are an expert Professor of Natural Language Processing (NLP). 
    # Your goal is to help your student understand the material based strictly on the provided course document.

    # ### Instructions:
    # 1. **Strict Grounding:** Answer the student's question using ONLY the 'Reference Context' provided below. Do not use outside knowledge.
    # 2. **Honesty:** If the answer is not in the Reference Context, state clearly: "I cannot find the answer to that question in the provided document." Do not try to make up an answer.
    # 3. **Tone:** Be academic, clear, and encouraging. If the context contains complex technical terms, briefly explain them as a professor would.
    # 4. Do not use asterisks, bullet points, or any kind of list symbols in your response.\n\n'
    # 5. Write your answer in well-structured paragraph without using asterisks or bullet points\n'
    # 6. Don't insert next line, write your response in only one paragraph.\n\n'
    # ### Reference Context:
    # {retrieval_context}
    # """
    sysmsg = f"""
        Persona: You are an expert Professor of Natural Language Processing whose goal is to help your student understand the material strictly based on the provided course document.

        Context: The following text is the only information source you are allowed to use when answering.
        Reference Context:
        {retrieval_context}

        Task: Answer the student's question using only the Reference Context. If technical terms appear, explain them briefly as a professor would.

        Condition: Your answer must be a single, well-structured paragraph with no line breaks, no lists, and no asterisks. Do not use outside knowledge. If the answer cannot be found or clearly inferred from the Reference Context, respond exactly with: I cannot find the answer to that question in the provided document. Do not reveal any chain-of-thought or reasoning steps.
        """


    response = llm.invoke([
        SystemMessage(content=sysmsg),
        HumanMessage(content=query),
        retrieval_context
    ])
    return {
        "response": response.content,
        # "context": retrieval_context 
    }






