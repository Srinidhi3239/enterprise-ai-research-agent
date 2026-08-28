import os
import chromadb
from chromadb.utils import embedding_functions
from pypdf import PdfReader
from typing import List, Dict, Any

CHROMA_PATH = os.path.join(os.path.dirname(__file__), "../../chroma_db")

embedding_fn = embedding_functions.SentenceTransformerEmbeddingFunction(
    model_name="all-MiniLM-L6-v2"
)

client = chromadb.PersistentClient(path=CHROMA_PATH)
collection = client.get_or_create_collection(
    name="enterprise_knowledge",
    embedding_function=embedding_fn
)

def chunk_text(text: str, chunk_size: int = 400, overlap: int = 40) -> List[str]:
    words = text.split()
    chunks = []
    for i in range(0, len(words), chunk_size - overlap):
        chunk = " ".join(words[i:i + chunk_size])
        if chunk.strip():
            chunks.append(chunk)
    return chunks

def index_document(file_bytes: bytes, filename: str) -> int:
    text = ""
    if filename.endswith(".pdf"):
        import io
        reader = PdfReader(io.BytesIO(file_bytes))
        for page in reader.pages:
            extracted = page.extract_text()
            if extracted:
                text += extracted + "\n"
    else:
        text = file_bytes.decode("utf-8", errors="ignore")

    chunks = chunk_text(text)
    if not chunks:
        return 0

    ids = [f"{filename}_chunk_{i}" for i in range(len(chunks))]
    metadatas = [{"source": filename, "chunk_id": i} for i in range(len(chunks))]
    
    collection.add(documents=chunks, metadatas=metadatas, ids=ids)
    return len(chunks)

def retrieve_context(query: str, n_results: int = 4) -> List[Dict[str, Any]]:
    results = collection.query(query_texts=[query], n_results=n_results)
    retrieved = []
    if results and results["documents"] and results["documents"][0]:
        for doc, meta, doc_id in zip(results["documents"][0], results["metadatas"][0], results["ids"][0]):
            retrieved.append({"id": doc_id, "source": meta["source"], "content": doc})
    return retrieved