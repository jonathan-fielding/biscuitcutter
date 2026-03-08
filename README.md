# BiscuitCutter

A command-line utility that creates projects from project templates, e.g. creating a TypeScript package project from a project template.

BiscuitCutter is a Node.js implementation inspired by [Cookiecutter](https://github.com/cookiecutter/cookiecutter). It's compatible with the majority of existing Cookiecutter templates—use the thousands of templates already available on GitHub, or create your own.

## Installation

```bash
npm install -g biscuitcutter
```

Or use it directly with npx:

```bash
npx biscuitcutter <template>
```

## Features

- **Cross-Platform:** Works on Windows, macOS, and Linux.
- **TypeScript Native:** Built with TypeScript for excellent type safety and IDE support.
- **Cookiecutter Compatible:** Works with existing Cookiecutter templates.
- **Multiple Template Sources:** Supports local directories, Git repositories, and zip files.
- **Nunjucks Templating:** Uses [Nunjucks](https://mozilla.github.io/nunjucks/) for powerful template rendering.

## Quick Start

### Use a GitHub-hosted template

```bash
# You'll be prompted to enter values
# Then it'll create your project in the current working directory
biscuitcutter gh:audreyfeldroy/cookiecutter-pypackage
```

### Use a local template

```bash
biscuitcutter ./my-template/
```

### Use it from TypeScript/JavaScript

```typescript
import { biscuitcutter } from 'biscuitcutter';

// Create project from a local template
await biscuitcutter('my-template/');

// Create project from a GitHub repo
await biscuitcutter('gh:username/repo-name');

// With options
await biscuitcutter('my-template/', {
  outputDir: './output',
  noInput: true,
  extraContext: {
    project_name: 'my-project',
  },
});
```

## Template Format

BiscuitCutter templates follow the same format as Cookiecutter templates:

```
my-template/
├── cookiecutter.json          # Template variables and defaults
├── {{cookiecutter.project_slug}}/
│   ├── README.md
│   ├── package.json
│   └── src/
│       └── index.ts
└── hooks/
    ├── pre_gen_project.js     # Runs before generation
    └── post_gen_project.js    # Runs after generation
```

### cookiecutter.json

Define your template variables:

```json
{
  "project_name": "My Project",
  "project_slug": "{{ cookiecutter.project_name | lower | replace(' ', '-') }}",
  "author": "Your Name",
  "description": "A short description"
}
```

## Configuration

Create a `.biscuitcutterrc` file in your home directory:

```yaml
default_context:
  author: "Your Name"
  email: "your.email@example.com"

abbreviations:
  gh: "https://github.com/{0}.git"
  gl: "https://gitlab.com/{0}.git"
  bb: "https://bitbucket.org/{0}.git"
```

## Hooks

BiscuitCutter supports pre and post generation hooks written in JavaScript or shell scripts:

- `hooks/pre_gen_project.js` - Runs before the project is generated
- `hooks/post_gen_project.js` - Runs after the project is generated

## Replay

BiscuitCutter saves your input values and can replay them:

```bash
# Generate a project
biscuitcutter my-template/

# Replay the last generation with the same values
biscuitcutter --replay my-template/
```

## CLI Options

```
Usage: biscuitcutter [options] <template>

Arguments:
  template                    Template directory, repository URL, or zip file

Options:
  -V, --version               Output the version number
  -o, --output-dir <dir>      Output directory (default: ".")
  --no-input                  Do not prompt for parameters
  -c, --config-file <file>    User configuration file
  --default-config            Do not load a config file
  --replay                    Replay the last template generation
  -f, --overwrite-if-exists   Overwrite output directory if it exists
  -h, --help                  Display help for command
```

## Related Projects

- [Cookiecutter](https://github.com/cookiecutter/cookiecutter) - The original Python implementation

## License

MIT License - see [LICENSE](LICENSE) for details.
