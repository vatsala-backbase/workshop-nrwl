import {
  formatFiles,
  ProjectConfiguration,
  Tree,
  updateJson,
} from '@nrwl/devkit';
import { getProjects } from '@nrwl/devkit/src/generators/project-configuration';

function getScopes(projectMap: Map<string, ProjectConfiguration>) {
  const projects: any[] = Array.from(projectMap).map((p) => p[1])
  const allScopes: string[] = projects
    .map((project) =>
      project.tags.filter((tag: string) => tag.startsWith('scope:'))
    )
    .reduce((acc, tags) => [...acc, ...tags], [])
    .map((scope: string) => scope.slice(6));
  return Array.from(new Set(allScopes));
}

function replaceScopes(content: string, scopes: string[]): string {
  const joinScopes = scopes.map((s) => `'${s}'`).join(' | ');
  const PATTERN = /interface Schema \{\n.*\n.*\n\}/gm;
  return content.replace(
    PATTERN,
    `interface Schema {
      name: string;
      directory: ${joinScopes};
    }`
  );
}

export default async function (host: Tree) {
  const scopes = getScopes(getProjects(host));
  updateJson(host, 'tools/generators/util-lib/schema.json', (schemaJson) => {
    schemaJson.properties.directory['x-prompt'].items = scopes.map((scope) => ({
      value: scope,
      label: scope,
    }));
    return schemaJson;
  });
  const content = host.read('tools/generators/util-lib/index.ts', 'utf-8');
  const newContent = replaceScopes(content, scopes);
  host.write('tools/generators/util-lib/index.ts', newContent);
  await formatFiles(host);
}
