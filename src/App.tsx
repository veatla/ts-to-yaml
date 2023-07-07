import { useState } from "react";

import CodeMirror, { ReactCodeMirrorProps } from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";

import "./App.css";
import { typeFormatter } from "./util/formatter";
const defaultValue = `
export interface IMessage {
      id: string;
      ts: number;
      subject_id: string;
      user_id: string;
      user_name: string;
      text_content: string;
}
`;
type InputChange = ReactCodeMirrorProps["onChange"];
function TextareaComponent({
      onChange,
      readOnly,
      value,
      label,
      id,
}: {
      onChange?: InputChange;
      readOnly?: boolean;
      value?: string;
      label?: string;
      id?: string;
}) {
      return (
            <div className="input-wrapper">
                  <label htmlFor={id}>{label}</label>
                  <CodeMirror
                        id={id}
                        readOnly={readOnly}
                        height="100%"
                        // width="100"
                        theme={"dark"}
                        value={value}
                        extensions={[
                              javascript({
                                    typescript: true,
                                    jsx: false,
                              }),
                        ]}
                        onChange={onChange}
                  />
            </div>
      );
}
function App() {
      const [yamlType, setYamlType] = useState("");
      const handleChangeTypescriptInput: InputChange = (e) => {
            setYamlType(typeFormatter(e));
      };
      return (
            <>
                  <div className="input-grid">
                        <TextareaComponent
                              onChange={handleChangeTypescriptInput}
                              label="Typescript Types"
                              id="typescript"
                              value={defaultValue}
                        />
                        <TextareaComponent
                              label="Swagger YAML Schema"
                              id="yaml"
                              onChange={handleChangeTypescriptInput}
                              value={yamlType}
                              readOnly
                        />
                  </div>
            </>
      );
}

export default App;
