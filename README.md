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
- **Cookiecutter Compatible:** Works with existing Cookiecutter templates while offering `biscuitcutter.json` / native fallback variables.
- **Template Update Tracking:** Built-in Cruft-like project state tracking allowing easy updates and diff checks from the original template over time.
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

BiscuitCutter templates follow the same format as Cookiecutter templates, but you can also use `biscuitcutter.json` and internal `biscuitcutter` variables:

```
my-template/
├── biscuitcutter.json         # Template variables and defaults (or cookiecutter.json)
├── {{biscuitcutter.project_slug}}/
│   ├── README.md
│   ├── package.json
│   └── src/
│       └── index.ts
└── hooks/
    ├── pre_gen_project.js     # Runs before generation
    └── post_gen_project.js    # Runs after generation
```

### biscuitcutter.json (or cookiecutter.json)

Define your template variables:

```json
{
  "project_name": "My Project",
  "project_slug": "{{ biscuitcutter.project_name | lower | replace(' ', '-') }}",
  "author": "Your Name",
  "description": "A short description"
}
```

The templating engine understands both `biscuitcutter.*` and `cookiecutter.*` internally, ensuring cross-compatibility with older templates.

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

## Update Tracking (Cruft Compatible)

BiscuitCutter includes state tracking functionally comparable to [Cruft](https://github.com/cruft/cruft). When you create a template with the `create` command, a `.biscuitcutter.json` state file is generated. This lets you check for upstream template diffs and apply updates without losing local changes:

```bash
# Create a tracked project
biscuitcutter create my-template/

# Check if an update is available
cd my-project
biscuitcutter check

# See what would change
biscuitcutter diff

# Apply upstream updates
biscuitcutter update
```

## CLI Options

```
Usage: biscuitcutter [options] [command] [template]

Create a project from a BiscuitCutter project template (TEMPLATE).

BiscuitCutter is a port of the popular Cookiecutter tool to TypeScript.

Arguments:
  template                        Template directory or repository URL

Options:
  -V, --version                   output the version number
  -e, --extra-context <items...>  Extra context items in key=value format
  --no-input                      Do not prompt for parameters and only use
                                  biscuitcutter.json (or cookiecutter.json) file
                                  content
  -c, --checkout <checkout>       Branch, tag or commit to checkout after git
                                  clone
  --directory <directory>         Directory within repo that holds
                                  biscuitcutter.json (or cookiecutter.json) file
  -v, --verbose                   Print debug information (default: false)
  --replay                        Do not prompt for parameters and only use
                                  information entered previously (default:
                                  false)
  --replay-file <path>            Use this file for replay instead of the
                                  default
  -f, --overwrite-if-exists       Overwrite the contents of the output directory
                                  if it already exists (default: false)
  -s, --skip-if-file-exists       Skip the files in the corresponding
                                  directories if they already exist (default:
                                  false)
  -o, --output-dir <dir>          Where to output the generated project dir into
                                  (default: ".")
  --config-file <path>            User configuration file
  --default-config                Do not load a config file. Use the defaults
                                  instead (default: false)
  --debug-file <path>             File to be used as a stream for DEBUG logging
  --accept-hooks <value>          Accept pre/post hooks (yes/ask/no) (default:
                                  "yes")
  -l, --list-installed            List currently installed templates (default:
                                  false)
  --keep-project-on-failure       Do not delete project folder on failure
                                  (default: false)
  -h, --help                      display help for command

Commands:
  create [options] <template>     Create a new project from a template with
                                  update tracking enabled
  check [options]                 Check if the project is up to date with its
                                  template
  update [options]                Update the project to the latest template
                                  version
  diff [options]                  Show the diff between the project and its
                                  template
  link [options] <template>       Link an existing project to a cookiecutter
                                  template
```

## Related Projects

- [Cookiecutter](https://github.com/cookiecutter/cookiecutter) - The original Python implementation

## License

MIT License - see [LICENSE](LICENSE) for details.
