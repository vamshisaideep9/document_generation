import io
import os
import subprocess
import tempfile
from docxtpl import DocxTemplate

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
TEMPLATES_DIR = os.path.join(BASE_DIR, "templates")

def create_document(template_name: str, data: dict, output_format: str = "docx") -> io.BytesIO:
    """
    Loads template, injects data, and optionally converts to PDF.
    """
    template_path = os.path.join(TEMPLATES_DIR, template_name)
    
    if not os.path.exists(template_path):
        raise FileNotFoundError(f"Template artifact '{template_name}' not found.")

    doc = DocxTemplate(template_path)
    doc.render(data)
    
    if output_format.lower() == "docx":
        file_stream = io.BytesIO()
        doc.save(file_stream)
        file_stream.seek(0)
        return file_stream
        
    elif output_format.lower() == "pdf":
        with tempfile.TemporaryDirectory() as temp_dir:
            docx_path = os.path.join(temp_dir, "temp.docx")
            
            doc.save(docx_path)
            try:
                subprocess.run(
                    ["libreoffice", "--headless", "--convert-to", "pdf", docx_path, "--outdir", temp_dir],
                    check=True,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE
                )
            except subprocess.CalledProcessError as e:
                raise RuntimeError(f"PDF Conversion Engine Failed: {e.stderr.decode()}")
            pdf_path = os.path.join(temp_dir, "temp.pdf")
            if not os.path.exists(pdf_path):
                raise FileNotFoundError("LibreOffice executed but PDF artifact was not created.")
                
            with open(pdf_path, "rb") as pdf_file:
                pdf_stream = io.BytesIO(pdf_file.read())
            
            pdf_stream.seek(0)
            return pdf_stream