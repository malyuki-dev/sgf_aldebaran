import zipfile
import xml.etree.ElementTree as ET
import sys

def read_docx(filename):
    try:
        with zipfile.ZipFile(filename) as docx:
            tree = ET.XML(docx.read('word/document.xml'))
            namespaces = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
            text = []
            for paragraph in tree.iterfind('.//w:p', namespaces):
                texts = [node.text for node in paragraph.iterfind('.//w:t', namespaces) if node.text]
                if texts:
                    text.append(''.join(texts))
            return '\n'.join(text)
    except Exception as e:
        return str(e)

if __name__ == '__main__':
    with open('docs.txt', 'w', encoding='utf-8') as out:
        for f in sys.argv[1:]:
            out.write(f"--- CONTENT OF {f} ---\n")
            out.write(read_docx(f))
            out.write("\n\n")
