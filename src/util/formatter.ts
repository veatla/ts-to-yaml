import {
      createSourceFile,
      ScriptTarget,
      ScriptKind,
      isEnumDeclaration,
      isInterfaceDeclaration,
      isTypeAliasDeclaration,
      EnumDeclaration,
      InterfaceDeclaration,
      TypeAliasDeclaration,
      MappedTypeNode,
      TypeElement,
      TypeNode,
      SourceFile,
} from "typescript";
const tab = (count = 1) => "  ".repeat(count);
// const regexJsDocComments = new RegExp(/\/\*\*[^*/]*\*\//gm);
// const regexDefaultComments = new RegExp(/\/\/[^\n]*/gm);
// const regexMultiLineComments = new RegExp(/\/\*[^*/]*\*\//);
// const regexTypescriptItem = new RegExp(
//       /(type|enum|interface)\s+(\w+)\s+(=\s+)?\{[^}]*}/gm
// );
// const regexTypescriptTitle = new RegExp(/(type|interface|enum)\s+(\w+)/);
// const regexKeyAndDefinition = new RegExp(
//       /([^?\n:=]+)\s*(\??:|=){1}\s*(["'`\w*\s]{2,}(\s*\|\s*[\w\s"'`]+)*)/g
// );
type PropertyItemType = {
      keyName: string;
      definitions: string[];
      types: string[];
      items: string;
      isRequired: boolean;
      isLiteral: boolean;
};
type InterfaceItem = {
      title: string;
      type: "enum" | "type" | "interface";
      properties: PropertyItemType[];
      requiredList: string[];
};

const typesList = new Map<string, InterfaceItem>();
const TypescriptItems = new Map<string, InterfaceItem>();

export function typeFormatter(tsValue: string) {
      typesList.clear();
      const val = {
            value: "",
      };
      const sourceFile = createSourceFile(
            "dummy.ts",
            tsValue,
            ScriptTarget.Latest,
            false,
            ScriptKind.TS
      );
      for (const node of sourceFile.statements) {
            const isValid =
                  isEnumDeclaration(node) ||
                  isInterfaceDeclaration(node) ||
                  isTypeAliasDeclaration(node);
            if (isValid) {
                  if ("type" in node && "members" in node.type) {
                        typeMapper(node, sourceFile);
                  }
            }
      }
      for (const [key, value] of typesList) {
            val.value += `${key}:\n`;
            val.value += `${tab()}properties:\n`;
            const isEnum = value.type === "enum";
            if (isEnum) {
                  val.value += enumToString(value.properties);
            } else {
                  for (const type of value.properties) {
                        val.value += propertyObjectToString(type);
                  }
                  if (value.requiredList.length) {
                        val.value += `${tab(1)}required:\n`;
                        for (const type of value.requiredList) {
                              val.value += `${tab(2)}- ${type}\n`;
                        }
                  }
            }
            val.value += `\n`;
      }
      return val.value;
}

function typeMapper(node: TypeAliasDeclaration, sourceFile: SourceFile) {
      const mappedTypeNode = node.type as MappedTypeNode;
      const name = node.name.text;
      const item: InterfaceItem = {
            properties: [],
            requiredList: [],
            title: name,
            type: "type",
      };
      for (const member of mappedTypeNode.members ?? []) {
            const memberName = member?.name?.getText(sourceFile);
            const property: PropertyItemType = {
                  definitions: [],
                  isLiteral: false,
                  isRequired: false,
                  items: "",
                  keyName: `${memberName}`,
                  types: [],
            };
            const type = "type" in member ? (member.type as TypeNode) : null;
            if (memberName) {
                  const definitions = type
                        ?.getText(sourceFile)
                        .split(/\s*\|\s*/gm);
                  if (!member?.questionToken) {
                        item.requiredList.push(memberName);
                  }
                  if (definitions?.length) {
                        for (const definition of definitions) {
                              const check = checkType(definition);
                              property.types.push(check.type);
                              if (check.isLiteral) {
                                    property.isLiteral = check.isLiteral;
                              }
                        }
                  }
            }
            item.properties.push(property)
      }
      typesList.set(name, item);
}
function enumToString(properties: PropertyItemType[]) {
      const type = [...new Set(properties.flatMap((v) => v.types))];
      const definitions = [
            ...new Set(properties.flatMap((v) => v.definitions)),
      ];
      const te = {
            xt: "",
      };

      if (type.length > 1) {
            te.xt += `${tab(3)}oneOf:\n`;
            for (const t of type) {
                  te.xt += `${tab(4)}- type: ${t}\n`;
            }
      } else {
            te.xt += `${tab(3)}type: ${type[0]}\n`;
      }
      te.xt += `${tab(3)}enum:\n`;
      for (const definition of definitions) {
            te.xt += `${tab(4)}- ${definition.trim()}\n`;
      }
      return te.xt;
}
function propertyObjectToString(properties: PropertyItemType) {
      const { isLiteral, items, keyName, definitions, types } = properties;
      const te = {
            xt: "",
      };

      const type = [...new Set(types)];
      te.xt += `${tab(2)}${keyName}:\n`;

      if (type.length > 1) {
            te.xt += `${tab(3)}oneOf:\n`;
            for (const t of type) {
                  te.xt += `${tab(4)}- type: ${t}\n`;
            }
      } else {
            te.xt += `${tab(3)}type: ${type[0]}\n`;
      }

      if (isLiteral) {
            te.xt += `${tab(3)}enum:\n`;
            for (const definition of definitions) {
                  te.xt += `${tab(4)}- ${definition}\n`;
            }
      }
      if (items.length) {
            te.xt += `${tab(2)}items:\n`;
            te.xt += `${tab(3)}${items}\n`;
      }

      return te.xt;
}

function checkType(value: string) {
      const item = {
            type: "undefined",
            isLiteral: false,
      };
      const isLiteralString = /"(?:[^"\\]|\\.)*"/gim.test(value);
      if (isLiteralString) {
            item.isLiteral = true;
            item.type = "string";
      } else if (!Number.isNaN(Number(value))) {
            item.isLiteral = true;
            item.type = "number";
      } else if (value.includes("string")) item.type = "string";
      else if (value.includes("object")) item.type = "object";
      else if (value.includes("number")) item.type = "number";
      else if (value.includes("integer")) item.type = "integer";
      else if (value.includes("boolean")) item.type = "boolean";
      else if (value.includes("[]")) item.type = "array";
      return item;
      //     throw new Error(
      //       `${value} should be equal to one of the allowed values.`
      //       + `\nAllowed Values: array, boolean, integer, number, object, string`
      //     );
}
