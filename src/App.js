import { useEffect, useState } from "react";
import "./App.css";
import Aside from "./components/Aside";
import Footer from "./components/Footer";
import Header from "./components/Header";
import Main from "./components/Main";

const { app } = window.require("@electron/remote");
const fs = window.require("fs");
const path = window.require("path");

function App() {
  const [sideBarOpen, setSideBarOpen] = useState(false);
  const [config, setConfig] = useState({
    supply: 5,
    name: "HashLips NFT",
    symbol: "HNFT",
    description: "This is a collection about...",
    width: 1024,
    height: 1024,
    baseUri: "ipfs://ReplaceCID",
    inputPath: app.getAppPath(),
    outputPath: app.getAppPath(),
  });
  const [folderNames, setFolderNames] = useState([]);
  const [progress, setProgress] = useState(0);

  const [rarities, setRarities] = useState({
    items: [],
    groups: {},
    ranges: {},
    saved: false
  });

  const [status, setStatus] = useState("");

  const handleConfigChange = (event) => {
    setConfig({ ...config, [event.target.name]: event.target.value });
  };

  const toggleSideBar = () => {
    setSideBarOpen(!sideBarOpen);
  };

  const getRarityWeight = (_str) => {
    let nameWithoutExtension = _str.slice(0, -4);
    var nameWithoutWeight = Number(nameWithoutExtension.split("$").pop());
    if (isNaN(nameWithoutWeight)) {
      nameWithoutWeight = 1;
    }
    return nameWithoutWeight;
  };

  const cleanName = (_str) => {
    let nameWithoutExtension = _str.slice(0, -4);
    var nameWithoutWeight = nameWithoutExtension.split("$").shift();
    return nameWithoutWeight;
  };

  const getElements = (_path) => {
    return fs
      .readdirSync(_path)
      .filter((item) => !/(^|\/)\.[^\/\.]/g.test(item))
      .map((i, index) => {
        if (i.includes("-")) {
          setStatus(`Layer name can not contain dashes, please fix: ${i}`);
          throw new Error(
            `Layer name can not contain dashes, please fix: ${i}`
          );
        }
        return {
          id: index,
          name: cleanName(i),
          filename: i,
          path: `${_path}/${i}`,
          weight: getRarityWeight(i),
        };
      });
  };

  const getFolders = async () => {
    fs.readdir(config.inputPath, (err, files) => {
      if (err) {
        setStatus("Unable to load the folder set");
        return;
      }
      let newFiles = files
        .filter((item) => !/(^|\/)\.[^\/\.]/g.test(item))
        .map((file, index) => {
          return {
            id: index + 1,
            elements: getElements(path.join(config.inputPath, file)),
            name: file,
          };
        });
      setFolderNames(newFiles);
    });
  };

  useEffect(() => {
    setStatus("");
  }, [config, folderNames]);

  return (
    <div className="grid-container">
      <Header toggleSideBar={toggleSideBar} />
      <Aside
        toggleSideBar={toggleSideBar}
        sideBarOpen={sideBarOpen}
        config={config}
        setConfig={setConfig}
        handleConfigChange={handleConfigChange}
        getFolders={getFolders}
        getElements={getElements}
        folderNames={folderNames}
        setFolderNames={setFolderNames}
        setProgress={setProgress}
        setStatus={setStatus}
        setRarities={setRarities}
        rarities={rarities}
      />
      <Main
        config={config}
        folderNames={folderNames}
        progress={progress}
        status={status}
        rarities={rarities}
      />
      <Footer />
    </div>
  );
}

export default App;
