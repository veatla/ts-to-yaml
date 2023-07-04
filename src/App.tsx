import { ChangeEventHandler, useRef, useState } from "react";

import "./App.css";
import { typeFormatter } from "./util/formatter";

type InputChange = ChangeEventHandler<HTMLTextAreaElement>;

function App() {
      const [yamlType, setYamlType] = useState("");
      function handleClickConvert() {
            console.log("convert action");
      }
      const handleChangeTypescriptInput: InputChange = (e) => {
            setYamlType(typeFormatter(e.target.value));
      };
      return (
            <>
                  <div className="input-grid">
                        <div className="input-wrapper">
                              <label htmlFor="typescript">
                                    Typescript Types
                              </label>
                              <textarea
                                    name="typescript"
                                    id="typescript"
                                    className="input typescript-input"
                                    cols={30}
                                    rows={10}
                                    onChange={handleChangeTypescriptInput}
                              />
                        </div>
                        <div className="card">
                              <button onClick={handleClickConvert}>
                                    Convert
                              </button>
                        </div>
                        <div className="input-wrapper">
                              <label htmlFor="yaml">Yaml(Swagger)</label>
                              <textarea
                                    name="yaml"
                                    id="yaml"
                                    value={yamlType}
                                    disabled
                                    className="input yaml-input"
                                    cols={30}
                                    rows={10}
                              />
                        </div>
                  </div>
            </>
      );
}

export default App;
