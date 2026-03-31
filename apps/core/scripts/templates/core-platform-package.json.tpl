{
  "name": "{{npmScope}}/core-{{name}}",
  "version": "{{version}}",
  "description": "MediaGo Player core binary for {{os}} {{cpu}}",
  "os": ["{{os}}"],
  "cpu": ["{{cpu}}"],
  "bin": {
    "{{appName}}": "{{binaryFile}}"
  },
  "files": ["{{binaryFile}}", "{{configFile}}"],
  "license": "ISC"
}
