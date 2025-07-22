# ER Diagram Generator

A Node.js tool that automatically generates Entity Relationship (ER) diagrams from TypeScript entity files using TypeORM decorators.

## Features

- 📊 **Automatic Parsing**: Reads TypeScript entity files and extracts relationships
- 🎨 **Beautiful HTML Output**: Generates interactive HTML diagrams using Mermaid.js
- 🔗 **Relationship Detection**: Supports all TypeORM relationship types:
  - `@OneToMany` / `@ManyToOne`
  - `@OneToOne`
  - `@ManyToMany`
- 📝 **Mermaid Export**: Also generates raw Mermaid syntax for further customization
- 🎯 **Enum Support**: Detects and includes enum types in the diagram

## Project Structure

```
├── models/           # TypeScript entity files (.entity.ts)
├── enums/           # TypeScript enum files (.enum.ts)
├── generate-er-diagram.js    # Main generator script
├── package.json     # Project configuration
└── README.md        # This file
```

## Usage

### Quick Start

1. **Run the generator:**
   ```bash
   npm run generate
   ```
   or
   ```bash
   node generate-er-diagram.js
   ```

2. **Open the generated diagram:**
   - Open `er-diagram.html` in your browser
   - View the interactive ER diagram with all relationships

### Output Files

- **`er-diagram.html`** - Interactive HTML page with the ER diagram
- **`er-diagram.mmd`** - Raw Mermaid syntax for custom editing

## Supported TypeORM Decorators

The generator recognizes these TypeORM decorators:

- `@Entity()` - Entity class definitions
- `@PrimaryGeneratedColumn()` - Primary key columns
- `@Column()` - Regular columns
- `@OneToMany()` - One-to-many relationships
- `@ManyToOne()` - Many-to-one relationships
- `@OneToOne()` - One-to-one relationships
- `@ManyToMany()` - Many-to-many relationships
- `@JoinColumn()` - Foreign key specifications

## Example Entity Structure

```typescript
@Entity()
export class Employee extends StampableEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @OneToMany(() => LeaveRequest, (leaveRequest) => leaveRequest.employee)
  leaveRequestList: LeaveRequest[];

  @ManyToOne(() => Position, (position) => position.employeeList)
  position: Position;
}
```

## Generated Statistics

The HTML output includes:
- 📊 Number of entities found
- 🔗 Number of relationships detected
- 📝 Number of enums discovered
- 📋 List of all entities and enums

## Browser Compatibility

The generated HTML works in all modern browsers that support:
- ES6+ JavaScript
- CSS Grid
- SVG rendering (for Mermaid diagrams)

## Customization

### Modifying the Diagram Style

You can customize the appearance by:
1. Editing the CSS in the generated HTML file
2. Modifying the Mermaid configuration in the `<script>` section
3. Using the generated `.mmd` file with your own Mermaid renderer

### Adding Custom Parsing

To extend the parser for additional decorators:
1. Modify the `extractRelationships()` method
2. Add new regex patterns for your custom decorators
3. Update the Mermaid generation logic as needed

## Troubleshooting

### No Entities Found
- Ensure entity files are in the `./models` directory
- Check that files end with `.entity.ts`
- Verify files contain `@Entity()` decorators

### Missing Relationships
- Ensure relationships use proper TypeORM decorators
- Check that import statements are correct
- Verify relationship syntax matches expected patterns

### Diagram Not Rendering
- Check browser console for JavaScript errors
- Ensure internet connection (for Mermaid.js CDN)
- Try refreshing the page

## License

MIT License - Feel free to use and modify as needed. 