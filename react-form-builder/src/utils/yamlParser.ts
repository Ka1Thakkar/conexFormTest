import yaml from "js-yaml";

export type YamlObject = Record<string, any>;

/**
 * Parses a YAML string and returns a JS object.
 * Throws an error if parsing fails.
 * @param yamlString - The YAML string to parse
 */
export function parseYaml(yamlString: string): YamlObject {
  try {
    const doc = yaml.load(yamlString);
    if (typeof doc !== "object" || doc === null) {
      throw new Error("YAML did not parse to an object");
    }
    return doc as YamlObject;
  } catch (error) {
    throw new Error(`Failed to parse YAML: ${(error as Error).message}`);
  }
}
