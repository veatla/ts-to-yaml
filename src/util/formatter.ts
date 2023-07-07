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
      NodeArray,
      SyntaxKind,
} from "typescript";
const tab = (count = 1) => "  ".repeat(count);
const getTypeScriptKind = (value: SyntaxKind) => {
      switch (value) {
            case SyntaxKind.ArrayType:
                  return "array";
            case SyntaxKind.NumberKeyword:
                  return "number";
            case SyntaxKind.NumericLiteral:
                  return "number";
            case SyntaxKind.StringLiteral:
                  return "string";
            case SyntaxKind.ArrayLiteralExpression:
                  return "array";
            case SyntaxKind.ObjectLiteralExpression:
                  return "object";
            case SyntaxKind.FalseKeyword:
                  return "boolean";
            case SyntaxKind.TrueKeyword:
                  return "boolean";

            default:
                  console.log(value);
                  return "undefined";
      }
};
type PropertyItemType = {
      keyName: string;
      definitions: string[];
      types: string[];
      items: string;
      isReferenced: string | null;
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
const source: {
      file: SourceFile | null;
} = {
      file: null,
};
export function typeFormatter(tsValue: string) {
      typesList.clear();
      source.file = null;
      const val = {
            value: "",
      };
      source.file = createSourceFile(
            "dummy.ts",
            tsValue,
            ScriptTarget.Latest,
            false,
            ScriptKind.TS
      );
      for (const node of source.file.statements) {
            const isEnum = isEnumDeclaration(node),
                  isInterface = isInterfaceDeclaration(node),
                  isType = isTypeAliasDeclaration(node);
            if (isType) {
                  typeMapper(node);
            } else if (isEnum) {
                  enumMapper(node);
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
function typeMapper(node: TypeAliasDeclaration) {
      const name = node.name.text;
      const item: InterfaceItem = {
            properties: [],
            requiredList: [],
            title: name,
            type: "type",
      };
      if (node.type) {
            if ("literal" in node.type) {
                  const literal = node.type.literal as TypeElement;
                  if (literal) typeMemberMapper(Array(literal), item);
            } else if ("members" in node.type) {
                  typeMemberMapper(
                        node.type.members as NodeArray<TypeElement>,
                        item
                  );
            }
      }

      typesList.set(name, item);
}
function typeMemberMapper(
      membersList: NodeArray<TypeElement> | TypeElement[],
      item: InterfaceItem
) {
      if (!source.file) return false;
      for (const member of membersList ?? []) {
            const memberName = member?.name?.getText(source.file);
            const property: PropertyItemType = {
                  definitions: [],
                  isLiteral: false,
                  isReferenced: null as string | null,
                  isRequired: false,
                  items: "",
                  keyName: `${memberName}`,
                  types: [],
            };
            const type = "type" in member ? (member.type as TypeNode) : null;
            if (memberName) {
                  const types = type?.getText(source.file).split(/\s*\|\s*/gm);
                  if (!member?.questionToken) {
                        item.requiredList.push(memberName);
                  }
                  if (types?.length) {
                        for (const definition of types) {
                              const check = checkType(definition);
                              property.types.push(check.type);
                              if (check.isLiteral) {
                                    property.isLiteral = check.isLiteral;
                              }
                              if (check.isReferenced) {
                                    property.isReferenced = check.isReferenced;
                              }
                        }
                  }
            }
            item.properties.push(property);
      }
}
function memberMapper(
      membersList: EnumDeclaration["members"],
      item: InterfaceItem
) {
      if (!source.file) return false;
      for (const member of membersList ?? []) {
            const memberName = member?.name?.getText(source.file);
            const property: PropertyItemType = {
                  definitions: [],
                  isLiteral: false,
                  isRequired: false,
                  isReferenced: null,
                  items: "",
                  keyName: `${memberName}`,
                  types: [],
            };
            const type = "type" in member ? (member.type as TypeNode) : null;
            if (memberName) {
                  const definitions = type
                        ?.getText(source.file)
                        .split(/\s*\|\s*/gm);
                  if (definitions?.length) {
                        for (const definition of definitions) {
                              const check = checkType(definition);
                              property.types.push(check.type);
                              if (check.isLiteral) {
                                    property.isLiteral = check.isLiteral;
                              }
                              if (check.isReferenced) {
                                    property.isReferenced = check.isReferenced;
                              }
                        }
                  } else {
                        const initializer = member.initializer?.getText(
                              source.file
                        );
                        if (member.initializer?.kind) {
                              property.types.push(
                                    getTypeScriptKind(member.initializer?.kind)
                              );
                        }
                        if (initializer) property.definitions.push(initializer);
                  }
            }
            item.properties.push(property);
      }
}
function enumMapper(node: EnumDeclaration) {
      const name = node.name.text;
      const item: InterfaceItem = {
            properties: [],
            requiredList: [],
            title: name,
            type: "enum",
      };

      if (node.members) memberMapper(node.members, item);
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
      const { isLiteral, isReferenced, items, keyName, definitions, types } =
            properties;
      const te = {
            xt: "",
      };

      const type = [...new Set(types.filter((v) => v.length))];
      te.xt += `${tab(2)}${keyName}:\n`;

      if (type.length > 1) {
            te.xt += `${tab(3)}oneOf:\n`;
            for (const t of type) {
                  te.xt += `${tab(4)}- type: ${t}\n`;
            }
      } else {
            if (type[0]) te.xt += `${tab(3)}type: ${type[0]}\n`;
      }
      if (isReferenced) {
            te.xt += `${tab(3)}$ref: '#/components/schemas/${isReferenced}'\n`;

            return te.xt;
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

function checkType(value: string, isParent?: boolean) {
      const item = {
            type: "undefined",
            isLiteral: false,
            isReferenced: null as string | null,
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
      else if (value.includes("[]")) {
            item.isReferenced = value.replace("[]", "");
            item.type = "array";
      } else {
            item.type = "";
            if (!isParent) {
                  item.isReferenced = value;
                  // const check = checkType(value, true);
                  // if (check.type === "array" || check.type === value) {
                  //       item.isReferenced = value;
                  // }
            }
      }
      return item;
      //     throw new Error(
      //       `${value} should be equal to one of the allowed values.`
      //       + `\nAllowed Values: array, boolean, integer, number, object, string`
      //     );
}
