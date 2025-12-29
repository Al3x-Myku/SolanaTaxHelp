
import sys
try:
    from lxml import etree
except ImportError:
    print("lxml not installed. Trying to install...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "lxml"])
    from lxml import etree

def validate(xml_path, xsd_path):
    try:
        xmlschema_doc = etree.parse(xsd_path)
        xmlschema = etree.XMLSchema(xmlschema_doc)
        
        xml_doc = etree.parse(xml_path)
        
        if xmlschema.validate(xml_doc):
            print("VALID: The XML file is valid against the schema.")
            return True
        else:
            print("INVALID: The XML file is NOT valid!")
            for error in xmlschema.error_log:
                print(f"  Line {error.line}: {error.message}")
            return False
    except Exception as e:
        print(f"Error: {e}")
        return False

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python validate.py <xml_file> <xsd_file>")
        sys.exit(1)
        
    validate(sys.argv[1], sys.argv[2])
