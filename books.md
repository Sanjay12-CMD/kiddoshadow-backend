Recommended folder structure
backend/books/
  class6/
    english/
      chapter-1.pdf
      chapter-2.pdf
  class7/
    science/
      ch-01.pdf

Ingestion command
node src/modules/rag/ingestBooks.js ./books

This creates/updates: backend/rag_data/chroma with collection cbse_books.

Start ChromaDB (required)
Set `CHROMA_URL` in backend `.env` (default is `http://localhost:8000`).

Option A: Docker

powershell
docker run -p 8000:8000 -v ${PWD}\rag_data\chroma:/chroma/chroma chromadb/chroma:latest

cmd
docker run -p 8000:8000 -v "%cd%\rag_data\chroma:/chroma/chroma" chromadb/chroma:latest


Option B: Python (if chromadb installed)

pip install chromadb
chroma run --path ./rag_data/chroma --host 0.0.0.0 --port 8000


Rebuild from scratch
Remove-Item -Recurse -Force rag_data/chroma
node src/modules/rag/ingestBooks.js ./books
