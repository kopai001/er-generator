const fs = require("fs");
const path = require("path");

class ERDiagramGenerator {
  constructor() {
    this.entities = new Map();
    this.enums = new Map();
    this.relationships = [];
  }

  // Read and parse all entity files
  parseEntities(modelsDir) {
    const files = fs.readdirSync(modelsDir);

    files.forEach((file) => {
      if (file.endsWith(".entity.ts")) {
        const filePath = path.join(modelsDir, file);
        const content = fs.readFileSync(filePath, "utf8");
        this.parseEntityFile(content, file);
      }
    });
  }

  // Read and parse all enum files
  parseEnums(enumsDir) {
    const files = fs.readdirSync(enumsDir);

    files.forEach((file) => {
      if (file.endsWith(".enum.ts")) {
        const filePath = path.join(enumsDir, file);
        const content = fs.readFileSync(filePath, "utf8");
        this.parseEnumFile(content, file);
      }
    });
  }

  // Parse individual entity file
  parseEntityFile(content, filename) {
    // Extract entity name from class definition
    const entityMatch = content.match(
      /@Entity\(\)\s*(?:@[\w\s\(\),\.]+\s*)*export\s+class\s+(\w+)/
    );
    if (!entityMatch) return;

    const entityName = entityMatch[1];
    const entity = {
      name: entityName,
      filename: filename,
      columns: [],
      relationships: [],
    };

    // Extract primary key first
    const primaryKeyMatch = content.match(
      /@PrimaryGeneratedColumn\(\)\s*([a-zA-Z_]\w+):\s*([^;]+);/
    );
    if (primaryKeyMatch) {
      entity.columns.push({
        name: primaryKeyMatch[1],
        type: "number",
        isPrimary: true,
      });
    }

    // Extract regular columns with improved regex that captures full property declarations
    const lines = content.split("\n");
    let insideClass = false;
    let braceCount = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Check if we're inside the entity class
      if (line.includes("@Entity()") || line.includes("export class")) {
        insideClass = true;
        continue;
      }

      if (!insideClass) continue;

      // Count braces to know when we exit the class
      braceCount += (line.match(/{/g) || []).length;
      braceCount -= (line.match(/}/g) || []).length;

      if (braceCount < 0) break; // Exited the class

      // Look for @Column decorators
      if (line.includes("@Column(")) {
        // Look ahead to find the property declaration
        let j = i + 1;
        while (j < lines.length) {
          const propLine = lines[j].trim();

          // Skip decorator lines
          if (propLine.startsWith("@") || propLine === "") {
            j++;
            continue;
          }

          // Found property declaration
          const propMatch = propLine.match(
            /^([a-zA-Z_]\w+):\s*([^;]+);?\s*(?:\/\/.*)?$/
          );
          if (propMatch) {
            const [, columnName, columnType] = propMatch;
            const cleanType = this.cleanTypeForMermaid(columnType.trim());

            // Skip if already added as primary key
            if (!entity.columns.some((col) => col.name === columnName)) {
              entity.columns.push({
                name: columnName,
                type: cleanType,
                isPrimary: false,
              });
            }
          }
          break;
        }
      }
    }

    // Extract relationships
    this.extractRelationships(content, entityName, entity);

    this.entities.set(entityName, entity);
  }

  // Clean type names for Mermaid compatibility
  cleanTypeForMermaid(type) {
    // Remove comments and extra whitespace
    type = type.replace(/\s*\/\/.*$/, "").trim();

    // Handle common TypeScript types
    const typeMap = {
      "string[]": "string_array",
      "number[]": "number_array",
      Date: "Date",
      boolean: "boolean",
      string: "string",
      number: "number",
    };

    // Handle union types with null
    type = type.replace(/\s*\|\s*null$/, "");

    // If it's a direct mapping, use it
    if (typeMap[type]) return typeMap[type];

    // If it ends with Enum, keep it as is
    if (type.endsWith("Enum")) return type;

    // For array types
    if (type.includes("[]")) {
      return type.replace(/\[\]/g, "_array");
    }

    // Handle specific problematic patterns
    if (
      type.includes("{") ||
      type.includes("}") ||
      type.includes("(") ||
      type.includes(")")
    ) {
      // For complex types like enums with configs, just use 'enum'
      if (type.toLowerCase().includes("enum")) return "enum";
      return "object";
    }

    // Clean any remaining problematic characters for Mermaid, but preserve common type patterns
    const cleaned = type.replace(/[^a-zA-Z0-9_]/g, "_");

    // Remove consecutive underscores
    return cleaned.replace(/_+/g, "_").replace(/^_|_$/g, "");
  }

  // Extract relationship information
  extractRelationships(content, entityName, entity) {
    // OneToMany relationships
    const oneToManyMatches = content.matchAll(
      /@OneToMany\(\(\)\s*=>\s*(\w+),\s*\([^)]+\)\s*=>[^)]+\)\s*(\w+):/g
    );
    for (const match of oneToManyMatches) {
      const [, targetEntity, relationName] = match;
      entity.relationships.push({
        type: "OneToMany",
        target: targetEntity,
        property: relationName,
      });
      this.relationships.push({
        from: entityName,
        to: targetEntity,
        type: "one-to-many",
        fromProperty: relationName,
      });
    }

    // ManyToOne relationships
    const manyToOneMatches = content.matchAll(
      /@ManyToOne\(\(\)\s*=>\s*(\w+),\s*\([^)]+\)\s*=>[^)]+\)\s*(?:@JoinColumn[^)]*\)\s*)?(\w+):/g
    );
    for (const match of manyToOneMatches) {
      const [, targetEntity, relationName] = match;
      entity.relationships.push({
        type: "ManyToOne",
        target: targetEntity,
        property: relationName,
      });
      this.relationships.push({
        from: entityName,
        to: targetEntity,
        type: "many-to-one",
        fromProperty: relationName,
      });
    }

    // OneToOne relationships
    const oneToOneMatches = content.matchAll(
      /@OneToOne\(\(\)\s*=>\s*(\w+)(?:,\s*\([^)]+\)\s*=>[^)]+)?\)\s*(?:@JoinColumn[^)]*\)\s*)?(\w+):/g
    );
    for (const match of oneToOneMatches) {
      const [, targetEntity, relationName] = match;
      entity.relationships.push({
        type: "OneToOne",
        target: targetEntity,
        property: relationName,
      });
      this.relationships.push({
        from: entityName,
        to: targetEntity,
        type: "one-to-one",
        fromProperty: relationName,
      });
    }

    // ManyToMany relationships
    const manyToManyMatches = content.matchAll(
      /@ManyToMany\(\(\)\s*=>\s*(\w+)(?:,\s*\([^)]+\)\s*=>[^)]+)?\)\s*(\w+):/g
    );
    for (const match of manyToManyMatches) {
      const [, targetEntity, relationName] = match;
      entity.relationships.push({
        type: "ManyToMany",
        target: targetEntity,
        property: relationName,
      });
      this.relationships.push({
        from: entityName,
        to: targetEntity,
        type: "many-to-many",
        fromProperty: relationName,
      });
    }
  }

  // Parse enum file
  parseEnumFile(content, filename) {
    const enumMatch = content.match(/export\s+enum\s+(\w+)/);
    if (!enumMatch) return;

    const enumName = enumMatch[1];
    const values = [];

    const valueMatches = content.matchAll(/(\w+)\s*=\s*['"`]([^'"`]+)['"`]/g);
    for (const match of valueMatches) {
      values.push(match[1]);
    }

    this.enums.set(enumName, {
      name: enumName,
      filename: filename,
      values: values,
    });
  }

  // Generate Mermaid ER diagram syntax
  generateMermaidERD() {
    let mermaid = "erDiagram\n\n";

    // Add entities with their attributes
    for (const [entityName, entity] of this.entities) {
      mermaid += `    ${entityName} {\n`;

      // Sort columns to put primary key first
      const sortedColumns = [...entity.columns].sort((a, b) => {
        if (a.isPrimary && !b.isPrimary) return -1;
        if (!a.isPrimary && b.isPrimary) return 1;
        return 0;
      });

      sortedColumns.forEach((column) => {
        const keyIndicator = column.isPrimary ? " PK" : "";
        // Ensure proper Mermaid syntax: type first, then name, then key indicator
        mermaid += `        ${column.type} ${column.name}${keyIndicator}\n`;
      });

      mermaid += "    }\n\n";
    }

    // Add relationships - only add if both entities exist
    this.relationships.forEach((rel) => {
      // Check if both entities exist in our parsed entities
      if (!this.entities.has(rel.from) || !this.entities.has(rel.to)) {
        return; // Skip this relationship
      }

      let relationshipSymbol = "";
      switch (rel.type) {
        case "one-to-many":
          relationshipSymbol = "||--o{";
          break;
        case "many-to-one":
          relationshipSymbol = "}o--||";
          break;
        case "one-to-one":
          relationshipSymbol = "||--||";
          break;
        case "many-to-many":
          relationshipSymbol = "}o--o{";
          break;
      }

      // Clean the property name for Mermaid
      const cleanPropertyName = rel.fromProperty.replace(/[^a-zA-Z0-9_]/g, "_");
      mermaid += `    ${rel.from} ${relationshipSymbol} ${rel.to} : "${cleanPropertyName}"\n`;
    });

    return mermaid;
  }

  // Generate HTML file with embedded Mermaid diagram
  generateHTML() {
    const mermaidERD = this.generateMermaidERD();

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Entity Relationship Diagram</title>
    <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 100%;
            margin: 0 auto;
            background-color: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #333;
            text-align: center;
            margin-bottom: 30px;
        }
        .diagram-container {
            text-align: center;
            overflow-x: auto;
            margin: 20px 0;
        }
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin: 20px 0;
        }
        .stat-card {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 6px;
            border-left: 4px solid #007bff;
        }
        .stat-number {
            font-size: 24px;
            font-weight: bold;
            color: #007bff;
        }
        .stat-label {
            color: #666;
            font-size: 14px;
        }
        .entity-list {
            margin-top: 30px;
        }
        .entity-item {
            background: white;
            border: 1px solid #ddd;
            border-radius: 4px;
            padding: 10px;
            margin: 5px 0;
            display: inline-block;
            margin-right: 10px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Entity Relationship Diagram</h1>
        
        <div class="stats">
            <div class="stat-card">
                <div class="stat-number">${this.entities.size}</div>
                <div class="stat-label">Entities</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${this.relationships.length}</div>
                <div class="stat-label">Relationships</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${this.enums.size}</div>
                <div class="stat-label">Enums</div>
            </div>
        </div>

        <div class="diagram-container">
            <div class="mermaid">
${mermaidERD}
            </div>
        </div>

        <div class="entity-list">
            <h3>Entities:</h3>
            ${Array.from(this.entities.keys())
              .map((name) => `<span class="entity-item">${name}</span>`)
              .join("")}
        </div>

        <div class="entity-list">
            <h3>Enums:</h3>
            ${Array.from(this.enums.keys())
              .map((name) => `<span class="entity-item">${name}</span>`)
              .join("")}
        </div>
    </div>

    <script>
        mermaid.initialize({ 
            startOnLoad: true,
            theme: 'default',
            er: {
                fontSize: 12,
                useMaxWidth: true
            }
        });
    </script>
</body>
</html>`;

    return html;
  }

  // Main method to generate the ER diagram
  generate() {
    console.log("📊 Starting ER Diagram Generation...");

    // Parse entities and enums
    console.log("📖 Reading entity files...");
    this.parseEntities("./models");

    console.log("📖 Reading enum files...");
    this.parseEnums("./enums");

    console.log(
      `✅ Found ${this.entities.size} entities and ${this.enums.size} enums`
    );
    console.log(`🔗 Found ${this.relationships.length} relationships`);

    // Generate HTML
    console.log("🎨 Generating HTML diagram...");
    const html = this.generateHTML();

    // Write to file
    const outputFile = "er-diagram.html";
    fs.writeFileSync(outputFile, html);

    console.log(`✅ ER Diagram generated successfully: ${outputFile}`);
    console.log("🌐 Open the HTML file in your browser to view the diagram");

    // Also generate just the Mermaid syntax for reference
    const mermaidFile = "er-diagram.mmd";
    fs.writeFileSync(mermaidFile, this.generateMermaidERD());
    console.log(`📝 Mermaid syntax saved to: ${mermaidFile}`);
  }
}

// Run the generator
const generator = new ERDiagramGenerator();
generator.generate();
