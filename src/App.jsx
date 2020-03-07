/* eslint-disable jsx-a11y/accessible-emoji */
import React, { useState, useEffect, useCallback, useRef } from "react";
import "./App.css";
import { Editor, EditorState, ContentState } from "draft-js";
import axios from "axios";

const LOCALES = {
  de: "German",
  en: "English"
};

const debounce = (func, wait) => {
  let timeout;
  return function orig(...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), wait);
  };
};

function App() {
  const [langs, setLangs] = useState([]);

  useEffect(() => {
    axios
      .get("http://localhost:3000/", {
        params: {
          language_source: "de",
          language_target: "en"
        }
      })
      .then(({ data }) => {
        const res = data.map(item => ({
          ...item,
          target: EditorState.createEmpty()
        }));
        setLangs(res);
      });
  }, []);

  const handleTabPress = item => {
    const result = langs.map(item1 => {
      return item1.source === item.source
        ? {
            ...item1,
            suffix: "",
            target: EditorState.createWithContent(
              ContentState.createFromText(
                `${item1.target.getCurrentContent().getPlainText("\u0001")}${
                  item1.suffix
                }`
              )
            )
          }
        : item1;
    });
    setLangs(result);
  };

  const getLang = ({ value, item, langs }) => {
    const parseValue = value.getCurrentContent().getPlainText("\u0001");
    if (parseValue) {
      axios
        .post("http://localhost:3000/", {
          source: item.source,
          target: parseValue,
          language_target: item.language.target,
          language_source: item.language.source
        })
        .then(({ data }) => {
          const result = langs.map(item1 => {
            if (item1.source === item.source) {
              return {
                ...item1,
                suffix: data.suffix
              };
            } else {
              return item1;
            }
          });
          setLangs(result);
        });
    } else {
      console.log("no");
      const result = langs.map(item2 => {
        return item2.source === item.source
          ? {
              ...item2,
              suffix: ""
            }
          : item2;
      });
      setLangs(result);
    }
  };

  const debounceFunc = useCallback(debounce(getLang, 400), []);

  const handleEditorChange = (value, item) => {
    console.log("change");
    const res = langs.map(item1 => {
      return item1.source === item.source
        ? {
            ...item1,
            target: value
          }
        : item1;
    });
    setLangs(res);
    debounceFunc({ value, item, langs: res });
  };

  return (
    <div className="App">
      <header className="App-header container mx-auto px-12">
        <div className="content w-full">
          <div className="text-center">
            <h1>InteNMT</h1>
          </div>

          {langs.length > 0 ? (
            langs.map((item, index) => (
              <div key={item.source}>
                <div className={`content flex border border-light`}>
                  <div className="w-1/2 flex flex-col">
                    {index === 0 && (
                      <div className="head bg-light px-2 py-2">
                        <span>{LOCALES[item.language.source]}</span>
                      </div>
                    )}
                    <div className="editor-fixed rounded-l-sm p-4">
                      {item.source}
                    </div>
                  </div>

                  <div className="w-1/2 flex flex-col">
                    {index === 0 && (
                      <div className="head bg-light px-2 py-2">
                        <span>{LOCALES[item.language.target]}</span>
                      </div>
                    )}
                    <div className="editor relative h-40 border-l border-light p-4 rounded-r-sm">
                      <Editor
                        onTab={() => handleTabPress(item)}
                        editorState={item.target}
                        onChange={value => handleEditorChange(value, item)}
                      />
                      <div className="absolute bottom-0 left-0 p-1">
                        {item.suffix && (
                          <div
                            className="bg-light cursor-pointer border-2 border-primary px-1 rounded-sm"
                            style={{ fontSize: "12px" }}
                          >
                            {item.suffix}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center mt-12">
              <span>loading...</span>
            </div>
          )}
        </div>
      </header>
      <footer></footer>
    </div>
  );
}

export default App;
