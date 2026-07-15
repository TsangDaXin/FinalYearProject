"""
RAG (Retrieval-Augmented Generation) service.
Loads medical/physiotherapy PDFs, chunks them, stores in ChromaDB,
and retrieves relevant context for grounded recommendations.

Setup:
    1. Place PDF files in data/medical_pdfs/
    2. Run: python -c "from services.rag_service import build_vector_store; build_vector_store()"
    3. The vector store will be persisted in data/chroma_db/
"""

import os
from config.settings import PDF_DIRECTORY, CHROMA_PERSIST_DIR, EMBEDDING_MODEL


def _get_embeddings():
    """Get the embedding model (runs locally, no API needed)."""
    from langchain_community.embeddings import HuggingFaceEmbeddings
    return HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL)


def build_vector_store():
    """
    Load all PDFs from data/medical_pdfs/, chunk them,
    and store in ChromaDB. Run once during initial setup.
    """
    from langchain_community.document_loaders import PyPDFLoader
    from langchain_text_splitters import RecursiveCharacterTextSplitter
    from langchain_community.vectorstores import Chroma

    os.makedirs(PDF_DIRECTORY, exist_ok=True)
    os.makedirs(CHROMA_PERSIST_DIR, exist_ok=True)

    documents = []
    pdf_files = [f for f in os.listdir(PDF_DIRECTORY) if f.endswith(".pdf")]

    if not pdf_files:
        print(f"⚠ No PDF files found in {PDF_DIRECTORY}")
        print("  Add physiotherapy/OA guideline PDFs and re-run this script.")
        return None

    for filename in pdf_files:
        filepath = os.path.join(PDF_DIRECTORY, filename)
        print(f"  Loading: {filename}")
        loader = PyPDFLoader(filepath)
        documents.extend(loader.load())

    # Split into chunks
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
    )
    chunks = splitter.split_documents(documents)

    # Store in ChromaDB
    vectorstore = Chroma.from_documents(
        documents=chunks,
        embedding=_get_embeddings(),
        persist_directory=CHROMA_PERSIST_DIR,
    )
    vectorstore.persist()
    print(f"✓ Indexed {len(chunks)} chunks from {len(pdf_files)} PDFs ({len(documents)} pages)")
    return vectorstore


def retrieve_context(query: str, k: int = 5) -> str | None:
    """
    Retrieve the top-k most relevant chunks from the vector store.
    Returns concatenated text to inject into the prompt, or None if RAG is not set up.

    Args:
        query: Search query describing the patient's situation
        k: Number of chunks to retrieve

    Returns:
        Concatenated relevant text, or None if vector store doesn't exist
    """
    from langchain_community.vectorstores import Chroma

    if not os.path.exists(CHROMA_PERSIST_DIR):
        return None

    try:
        vectorstore = Chroma(
            persist_directory=CHROMA_PERSIST_DIR,
            embedding_function=_get_embeddings(),
        )
        results = vectorstore.similarity_search(query, k=k)
        if not results:
            return None
        return "\n\n---\n\n".join([doc.page_content for doc in results])
    except Exception:
        return None
