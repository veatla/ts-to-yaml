const tab = "  ";
const regexJsDocComments = /\/\*\*[^*/]*\*\//gm;
const regexDefaultComments = /\/\/[^\n]*/gm;
const regexMultiLineComments = /\/\*[^*/]*\*\//;
const regexTypescriptItem = /(type|enum|interface)\s(\w+)\s(=\s)?\{[^}]*}/gm;
const regexTypescriptTitle = /(type|interface|enum)\s(\w+)/;
const regexKeyAndDefinition =
      /\s*\w+(\??:|[\s=]+)(\s?\w+(\[\])?)+(\s?\|\s?\w+(\[\])?)*/gm;

function clearComments(value: string) {
      return value
            .replace(regexMultiLineComments, "")
            .replace(regexJsDocComments, "")
            .replace(regexDefaultComments, "");
}
export function typeFormatter(tsValue: string) {
      const cleared = clearComments(tsValue);
      const val = {
            value: "",
      };
      const matched = cleared.match(regexTypescriptItem);
      if (matched) {
            for (const typeString of matched) {
                  const typeTitle = regexTypescriptTitle.exec(typeString);
                  const ts = {
                        title: "",
                        type: "",
                        properties: "",
                        required: "",
                  };
                  if (typeTitle && typeTitle[2]) {
                        ts.title = typeTitle[2];
                  }
                  const matchedKeysList = typeString
                        .replace(regexTypescriptTitle, "")
                        .match(regexKeyAndDefinition);
                  if (matchedKeysList) {
                        for (const matchedKey of matchedKeysList) {
                              const val = getKeyAndValue(
                                    matchedKey,
                                    (typeTitle && typeTitle[1]) === "enum"
                              );
                              if (val) {
                                    if (val.required)
                                          ts.required += `\n${tab}${tab}- ${val.required}`;

                                    if (ts.properties.length)
                                          ts.properties += `${tab}`;
                                    ts.properties += `${val.value}`;
                              }
                        }
                  }
                  if (val.value.length) val.value += `\n\n`;
                  val.value += generateNewObject(ts);
            }
      }

      return val.value;
}
function generateNewObject({
      properties,
      required,
      title,
}: {
      title: string;
      properties: string;
      required: string;
}) {
      const val = {
            value: "",
      };

      // Adding Title
      val.value += `${title}: \n`;
      // Adding Type

      val.value += `${tab}type: object\n`;
      if (properties.length) {
            val.value += `${tab}properties: \n${tab}${properties}\n`;
      }

      // Adding required list If is exists
      if (required.length) val.value += `${tab}required: ${required}`;
      return val.value;
}

function getKeyAndValue(matchedType: string, isEnum?: boolean) {
      const val = {
            value: "",
            required: null as string | null,
            enumType: undefined as string | undefined,
      };
      const [key, value, enumValue] = matchedType.trim().split(/(\??:|[\s=]+)/gm);
      if (isEnum) console.log(key, enumValue);
      const isOptional = matchedType.search(/\?/gm);
      if (!key || !value) return null;
      if (isOptional > -1) val.required = key.trim();
      const type = checkType(value.trim());
      const items =
            type === "array"
                  ? `\n${tab}${tab}${tab}items:\n${tab}${tab}${tab}${tab}$ref: '#/components/schemas/${value
                          .replace("[]", "")
                          .trim()}'`
                  : "";
      val.value = `${tab}${key.trim()}: \n${tab}${tab}${tab}type: ${type}${items}\n`;
      return val;
}

function checkType(value: string) {
      if (value.includes("string")) return "string";
      if (value.includes("object")) return "object";
      else if (value.includes("number")) return "number";
      else if (value.includes("integer")) return "integer";
      else if (value.includes("boolean")) return "boolean";
      else if (value.includes("[]")) return "array";
      else {
            return "object";
      }
      //     throw new Error(
      //       `${value} should be equal to one of the allowed values.`
      //       + `\nAllowed Values: array, boolean, integer, number, object, string`
      //     );
}
