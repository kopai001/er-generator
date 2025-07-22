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
    // Extract entity name from class definition - handle both @Entity() and @Entity('table_name')
    const entityMatch = content.match(
      /@Entity\([^)]*\)\s*(?:@[\w\s\(\),\.]+\s*)*export\s+class\s+(\w+)/
    );
    if (!entityMatch) return; // Skip non-entity classes like embedded classes

    const entityName = entityMatch[1];
    const entity = {
      name: entityName,
      filename: filename,
      columns: [],
      relationships: [],
    };

    // Extract primary keys - handle both @PrimaryGeneratedColumn and @PrimaryColumn
    const primaryGenMatch = content.match(
      /@PrimaryGeneratedColumn\([^)]*\)\s*([a-zA-Z_]\w+):\s*([^;]+);/
    );
    if (primaryGenMatch) {
      entity.columns.push({
        name: primaryGenMatch[1],
        type: "number",
        isPrimary: true,
      });
    }

    const primaryColMatch = content.match(
      /@PrimaryColumn\([^)]*\)\s*([a-zA-Z_]\w+):\s*([^;]+);/
    );
    if (primaryColMatch) {
      entity.columns.push({
        name: primaryColMatch[1],
        type: this.cleanTypeForMermaid(primaryColMatch[2].trim()),
        isPrimary: true,
      });
    }

    // Extract regular columns with improved parsing - handle base classes
    const lines = content.split("\n");
    let insideRelevantClass = false;
    let braceCount = 0;
    let currentClass = "";

    // Find the base class name if it exists (e.g., FarmerLandBase for FarmerLand entity)
    const baseClassName = entityName + "Base";

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Track which class we're in
      const classMatch = line.match(/(?:export\s+)?class\s+(\w+)/);
      if (classMatch) {
        currentClass = classMatch[1];
        // Process columns in either the main entity class or its base class
        if (currentClass === entityName || currentClass === baseClassName) {
          insideRelevantClass = true;
          braceCount = 0; // Reset brace count for new class
        } else {
          insideRelevantClass = false;
        }
        continue;
      }

      // Only process columns inside relevant classes
      if (!insideRelevantClass) continue;

      // Count braces to know when we exit the class
      braceCount += (line.match(/{/g) || []).length;
      braceCount -= (line.match(/}/g) || []).length;

      if (braceCount < 0) break; // Exited the class

      // Look for @Column decorators (but skip embedded columns and @Expose properties)
      if (line.includes("@Column(") && !line.includes("@Column(() =>")) {
        // Look ahead to find the property declaration
        let j = i + 1;
        while (j < lines.length) {
          const propLine = lines[j].trim();

          // Skip decorator lines and empty lines
          if (propLine.startsWith("@") || propLine === "") {
            j++;
            continue;
          }

          // Found property declaration
          const propMatch = propLine.match(
            /^([a-zA-Z_]\w+)(\?)?:\s*([^;]+);?\s*(?:\/\/.*)?$/
          );
          if (propMatch) {
            const [, columnName, optional, columnType] = propMatch;
            const cleanType = this.cleanTypeForMermaid(columnType.trim());

            // Skip if already added as primary key
            if (!entity.columns.some((col) => col.name === columnName)) {
              entity.columns.push({
                name: columnName,
                type: cleanType,
                isPrimary: false,
                optional: !!optional,
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
      datetime2: "DateTime",
      bigint: "bigint",
    };

    // Handle union types with null and undefined
    type = type.replace(/\s*\|\s*(null|undefined)$/, "");

    // Handle optional types with ?
    type = type.replace(/\s*\?\s*$/, "");

    // If it's a direct mapping, use it
    if (typeMap[type]) return typeMap[type];

    // If it ends with Enum, keep it as is (but clean it)
    if (type.endsWith("Enum")) {
      return type.replace(/[^a-zA-Z0-9_]/g, "_");
    }

    // For array types
    if (type.includes("[]")) {
      const baseType = type.replace(/\[\]/g, "");
      const cleanBase = this.cleanTypeForMermaid(baseType);
      return cleanBase + "_array";
    }

    // Handle embedded types and complex types
    if (type.includes("Embedded") || type.includes("embedded")) {
      return "embedded";
    }

    // Handle specific problematic patterns
    if (
      type.includes("{") ||
      type.includes("}") ||
      type.includes("(") ||
      type.includes(")") ||
      type.includes("<") ||
      type.includes(">")
    ) {
      // For complex types like enums with configs, just use 'enum'
      if (type.toLowerCase().includes("enum")) return "enum";
      if (type.toLowerCase().includes("date")) return "Date";
      return "object";
    }

    // Handle custom class types (capitalize first letter)
    if (/^[A-Z][a-zA-Z0-9]*$/.test(type)) {
      return type;
    }

    // Clean any remaining problematic characters for Mermaid, but preserve common type patterns
    const cleaned = type.replace(/[^a-zA-Z0-9_]/g, "_");

    // Remove consecutive underscores and leading/trailing underscores
    return cleaned.replace(/_+/g, "_").replace(/^_+|_+$/g, "") || "unknown";
  }

  // Extract relationship information
  extractRelationships(content, entityName, entity) {
    // Extract relationships from both the main entity class and its base class
    const lines = content.split("\n");
    let insideRelevantClass = false;
    let currentClass = "";
    let braceCount = 0;

    // Find the base class name if it exists
    const baseClassName = entityName + "Base";

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Track which class we're in
      const classMatch = line.match(/(?:export\s+)?class\s+(\w+)/);
      if (classMatch) {
        currentClass = classMatch[1];
        // Process relationships in either the main entity class or its base class
        if (currentClass === entityName || currentClass === baseClassName) {
          insideRelevantClass = true;
          braceCount = 0; // Reset brace count for new class
        } else {
          insideRelevantClass = false;
        }
        continue;
      }

      // Only process relationships inside relevant classes
      if (!insideRelevantClass) continue;

      // Count braces to know when we exit the class
      braceCount += (line.match(/{/g) || []).length;
      braceCount -= (line.match(/}/g) || []).length;

      if (braceCount < 0) break; // Exited the class

      // OneToMany relationships
      if (line.includes("@OneToMany(")) {
        const oneToManyMatch = content
          .substring(content.indexOf(line))
          .match(
            /@OneToMany\(\(\)\s*=>\s*(\w+),?\s*(?:\([^)]+\)\s*=>[^)]+)?\)\s*(?:@[\w\s\(\),\.{}]+\s*)*(\w+):/
          );
        if (oneToManyMatch) {
          const [, targetEntity, relationName] = oneToManyMatch;
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
      }

      // ManyToOne relationships
      if (line.includes("@ManyToOne(")) {
        const manyToOneMatch = content
          .substring(content.indexOf(line))
          .match(
            /@ManyToOne\(\(\)\s*=>\s*(\w+),?\s*(?:\([^)]+\)\s*=>[^)]+)?\)\s*(?:@[\w\s\(\),\.{}]+\s*)*(\w+):/
          );
        if (manyToOneMatch) {
          const [, targetEntity, relationName] = manyToOneMatch;
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
      }

      // OneToOne relationships
      if (line.includes("@OneToOne(")) {
        const oneToOneMatch = content
          .substring(content.indexOf(line))
          .match(
            /@OneToOne\(\(\)\s*=>\s*(\w+)(?:,\s*\([^)]+\)\s*=>[^)]+)?\)\s*(?:@[\w\s\(\),\.{}]+\s*)*(\w+):/
          );
        if (oneToOneMatch) {
          const [, targetEntity, relationName] = oneToOneMatch;
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
      }

      // ManyToMany relationships
      if (line.includes("@ManyToMany(")) {
        const manyToManyMatch = content
          .substring(content.indexOf(line))
          .match(
            /@ManyToMany\(\(\)\s*=>\s*(\w+)(?:,\s*\([^)]+\)\s*=>[^)]+)?\)\s*(?:@[\w\s\(\),\.{}]+\s*)*(\w+):/
          );
        if (manyToManyMatch) {
          const [, targetEntity, relationName] = manyToManyMatch;
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
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
            overflow-x: hidden;
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
        .diagram-wrapper {
            position: relative;
            margin: 20px 0;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            background: #fafafa;
            overflow: hidden;
        }
        .zoom-controls {
            position: absolute;
            top: 10px;
            right: 10px;
            z-index: 1000;
            display: flex;
            gap: 5px;
            background: rgba(255, 255, 255, 0.9);
            padding: 5px;
            border-radius: 5px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        }
        .zoom-btn {
            background: #007bff;
            color: white;
            border: none;
            padding: 8px 12px;
            border-radius: 3px;
            cursor: pointer;
            font-size: 14px;
            font-weight: bold;
            transition: background-color 0.2s;
        }
        .zoom-btn:hover {
            background: #0056b3;
        }
        .zoom-btn:active {
            transform: scale(0.95);
        }
        .zoom-level {
            background: #28a745;
            color: white;
            border: none;
            padding: 8px 12px;
            border-radius: 3px;
            font-size: 12px;
            min-width: 60px;
        }
        .diagram-container {
            width: 100%;
            height: 80vh;
            overflow: auto;
            cursor: grab;
            user-select: none;
            position: relative;
        }
        .diagram-container:active {
            cursor: grabbing;
        }
        .diagram-container .mermaid {
            display: inline-block;
            transition: transform 0.1s ease-out;
            transform-origin: top left;
            min-width: 100%;
            min-height: 100%;
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
        .instructions {
            background: #e3f2fd;
            border: 1px solid #2196f3;
            border-radius: 5px;
            padding: 15px;
            margin: 20px 0;
        }
        .instructions h4 {
            margin: 0 0 10px 0;
            color: #1976d2;
        }
        .instructions ul {
            margin: 0;
            padding-left: 20px;
        }
        .instructions li {
            margin: 5px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🗺️ Interactive Entity Relationship Diagram</h1>
        
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

        <div class="instructions">
            <h4>🎮 Navigation Controls:</h4>
            <ul>
                <li><strong>Zoom:</strong> Use +/- buttons, mouse wheel, or pinch on mobile</li>
                <li><strong>Pan:</strong> Click and drag to move around the diagram</li>
                <li><strong>Reset:</strong> Click "Fit" to reset zoom and center the diagram</li>
                <li><strong>Full Screen:</strong> Click "⛶" for full screen mode</li>
            </ul>
        </div>

        <div class="diagram-wrapper">
            <div class="zoom-controls">
                <button class="zoom-btn" onclick="zoomIn()">+</button>
                <button class="zoom-btn" onclick="zoomOut()">−</button>
                <button class="zoom-level" id="zoomLevel">100%</button>
                <button class="zoom-btn" onclick="resetZoom()">Fit</button>
                <button class="zoom-btn" onclick="toggleFullscreen()">⛶</button>
            </div>
            <div class="diagram-container" id="diagramContainer">
                <div class="mermaid" id="mermaidDiagram">
${mermaidERD}
                </div>
            </div>
        </div>

        <div class="entity-list">
            <h3>📋 Entities:</h3>
            ${Array.from(this.entities.keys())
              .map((name) => `<span class="entity-item">${name}</span>`)
              .join("")}
        </div>

        <div class="entity-list">
            <h3>🏷️ Enums:</h3>
            ${Array.from(this.enums.keys())
              .map((name) => `<span class="entity-item">${name}</span>`)
              .join("")}
        </div>
    </div>

    <script>
        // Mermaid configuration
        mermaid.initialize({ 
            startOnLoad: true,
            theme: 'default',
            er: {
                fontSize: 12,
                useMaxWidth: false
            }
        });

        // Zoom and pan functionality
        let currentZoom = 1;
        let isPanning = false;
        let panStart = { x: 0, y: 0 };
        let panOffset = { x: 0, y: 0 };

        const container = document.getElementById('diagramContainer');
        const diagram = document.getElementById('mermaidDiagram');
        const zoomLevelDisplay = document.getElementById('zoomLevel');

        function updateZoomDisplay() {
            zoomLevelDisplay.textContent = Math.round(currentZoom * 100) + '%';
        }

        function applyTransform() {
            diagram.style.transform = \`scale(\${currentZoom}) translate(\${panOffset.x}px, \${panOffset.y}px)\`;
        }

        function zoomIn() {
            currentZoom = Math.min(currentZoom * 1.2, 5);
            applyTransform();
            updateZoomDisplay();
        }

        function zoomOut() {
            currentZoom = Math.max(currentZoom / 1.2, 0.1);
            applyTransform();
            updateZoomDisplay();
        }

        function resetZoom() {
            currentZoom = 1;
            panOffset = { x: 0, y: 0 };
            applyTransform();
            updateZoomDisplay();
            container.scrollTo(0, 0);
        }

        function toggleFullscreen() {
            if (!document.fullscreenElement) {
                container.parentElement.requestFullscreen();
            } else {
                document.exitFullscreen();
            }
        }

        // Mouse wheel zoom
        container.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? 0.9 : 1.1;
            currentZoom = Math.min(Math.max(currentZoom * delta, 0.1), 5);
            applyTransform();
            updateZoomDisplay();
        });

        // Touch zoom (pinch)
        let lastTouchDistance = 0;
        container.addEventListener('touchstart', (e) => {
            if (e.touches.length === 2) {
                const touch1 = e.touches[0];
                const touch2 = e.touches[1];
                lastTouchDistance = Math.sqrt(
                    Math.pow(touch2.clientX - touch1.clientX, 2) +
                    Math.pow(touch2.clientY - touch1.clientY, 2)
                );
            }
        });

        container.addEventListener('touchmove', (e) => {
            if (e.touches.length === 2) {
                e.preventDefault();
                const touch1 = e.touches[0];
                const touch2 = e.touches[1];
                const distance = Math.sqrt(
                    Math.pow(touch2.clientX - touch1.clientX, 2) +
                    Math.pow(touch2.clientY - touch1.clientY, 2)
                );
                
                if (lastTouchDistance > 0) {
                    const delta = distance / lastTouchDistance;
                    currentZoom = Math.min(Math.max(currentZoom * delta, 0.1), 5);
                    applyTransform();
                    updateZoomDisplay();
                }
                
                lastTouchDistance = distance;
            }
        });

        // Pan functionality
        container.addEventListener('mousedown', (e) => {
            if (e.button === 0) { // Left mouse button
                isPanning = true;
                panStart = { x: e.clientX, y: e.clientY };
                container.style.cursor = 'grabbing';
            }
        });

        document.addEventListener('mousemove', (e) => {
            if (isPanning) {
                const deltaX = (e.clientX - panStart.x) / currentZoom;
                const deltaY = (e.clientY - panStart.y) / currentZoom;
                panOffset.x += deltaX;
                panOffset.y += deltaY;
                applyTransform();
                panStart = { x: e.clientX, y: e.clientY };
            }
        });

        document.addEventListener('mouseup', () => {
            if (isPanning) {
                isPanning = false;
                container.style.cursor = 'grab';
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch(e.key) {
                    case '=':
                    case '+':
                        e.preventDefault();
                        zoomIn();
                        break;
                    case '-':
                        e.preventDefault();
                        zoomOut();
                        break;
                    case '0':
                        e.preventDefault();
                        resetZoom();
                        break;
                }
            }
        });

        // Initialize
        updateZoomDisplay();
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
    console.log("🎨 Generating interactive HTML diagram...");
    const html = this.generateHTML();

    // Write to file
    const outputFile = "er-diagram.html";
    fs.writeFileSync(outputFile, html);

    console.log(`✅ Zoomable ER Diagram generated successfully: ${outputFile}`);
    console.log(
      "🌐 Open the HTML file in your browser to view the interactive diagram"
    );
    console.log("🔍 Features: Zoom, Pan, Full-screen, and more!");

    // Also generate just the Mermaid syntax for reference
    const mermaidFile = "er-diagram.mmd";
    fs.writeFileSync(mermaidFile, this.generateMermaidERD());
    console.log(`📝 Mermaid syntax saved to: ${mermaidFile}`);
  }
}

// Run the generator
const generator = new ERDiagramGenerator();
generator.generate();
