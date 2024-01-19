import { getRarityScores, groupByRarity } from 'hashlips_art_engine/src/rarities';
import { FiX } from "react-icons/fi";
import { SortableItem, swapArrayPositions } from "react-sort-list";
import mask from "../assets/mask.png";
import "./Aside.css";
const { createCanvas, loadImage } = require(`canvas`);

const { dialog } = window.require("@electron/remote");
const fs = window.require("fs");
const path = window.require("path");

function Aside(p) {
  const canvas = createCanvas(p.config.width, p.config.height);
  const ctx = canvas.getContext("2d");

  var metadataList = [];
  var attributesList = [];
  var dnaList = new Set();

  const buildFolders = () => {
    if (fs.existsSync(path.join(p.config.outputPath, "build"))) {
      fs.rmdirSync(path.join(p.config.outputPath, "build"), {
        recursive: true,
      });
    }
    fs.mkdirSync(path.join(p.config.outputPath, "build"));
    fs.mkdirSync(path.join(p.config.outputPath, "build", "json"));
    fs.mkdirSync(path.join(p.config.outputPath, "build", "images"));
  };

  const swap = (dragIndex, dropIndex) => {
    let swappedFolders = swapArrayPositions(
      p.folderNames,
      dragIndex,
      dropIndex
    );

    p.setFolderNames([...swappedFolders]);
  };

  const textArea = (_label, _name, _initialValue, _placeholder = "") => {
    return (
      <>
        <p className="aside_list_item_input_label">{_label}</p>
        <textarea
          rows={5}
          style={{ fontSize: 12 }}
          name={_name}
          className="aside_list_item_input"
          onChange={p.handleConfigChange}
          value={_initialValue}
          placeholder={_placeholder}
        />
      </>
    );
  };

  const input = (_label, _name, _initialValue, _type, _placeholder = "") => {
    return (
      <>
        <p className="aside_list_item_input_label">{_label}</p>
        <input
          type={_type || "text"}
          name={_name}
          className="aside_list_item_input"
          onChange={p.handleConfigChange}
          value={_initialValue}
          placeholder={_placeholder}
        />
      </>
    );
  };

  const setPath = async (_field) => {
    let path = await dialog.showOpenDialog({
      properties: ["openDirectory"],
    });
    if (path.filePaths[0]) {
      p.setConfig({
        ...p.config,
        [_field]: path.filePaths[0],
      });
    }
  };

  const filterDNAOptions = (_dna) => {
    const dnaItems = _dna.split("-");
    const filteredDNA = dnaItems.filter((element) => {
      const query = /(\?.*$)/;
      const querystring = query.exec(element);
      if (!querystring) {
        return true;
      }
      const options = querystring[1].split("&").reduce((r, setting) => {
        const keyPairs = setting.split("=");
        return { ...r, [keyPairs[0]]: keyPairs[1] };
      }, []);

      return options.bypassDNA;
    });
    return filteredDNA.join("-");
  };

  const isDnaUnique = (_DnaList = new Set(), _dna = "") => {
    const _filteredDNA = filterDNAOptions(_dna);
    return !_DnaList.has(_filteredDNA);
  };

  const createDna = (_layers) => {
    let randNum = [];
    _layers.forEach((layer) => {
      var totalWeight = 0;
      layer.elements.forEach((element) => {
        totalWeight += element.weight;
      });
      // number between 0 - totalWeight
      let random = Math.floor(Math.random() * totalWeight);
      for (var i = 0; i < layer.elements.length; i++) {
        // subtract the current weight from the random weight until we reach a sub zero value.
        random -= layer.elements[i].weight;
        if (random < 0) {
          return randNum.push(
            `${layer.elements[i].id}:${layer.elements[i].filename}`
          );
        }
      }
    });
    return randNum.join("-");
  };

  const removeQueryStrings = (_dna) => {
    const query = /(\?.*$)/;
    return _dna.replace(query, "");
  };

  const cleanDna = (_str) => {
    const withoutOptions = removeQueryStrings(_str);
    var dna = Number(withoutOptions.split(":").shift());
    return dna;
  };

  const constructLayerToDna = (_dna = "", _layers = []) => {
    let mappedDnaToLayers = _layers.map((layer, index) => {
      let selectedElement = layer.elements.find(
        (e) => e.id === cleanDna(_dna.split("-")[index])
      );
      return {
        name: layer.name,
        selectedElement: selectedElement,
      };
    });
    return mappedDnaToLayers;
  };

  const loadLayerImg = async (_layer) => {
    try {
      return new Promise(async (resolve) => {
        const path = `file://${_layer.selectedElement.path.replace(/\s/g, "%20")}`;
        const image = await loadImage(path);
        resolve({ layer: _layer, loadedImage: image });
      });
    } catch (error) {
      console.error("Error loading image:", error);
    }
  };

  const addAttributes = (_element) => {
    let selectedElement = _element.layer.selectedElement;
    attributesList.push({
      trait_type: _element.layer.name,
      value: selectedElement.name,
    });
  };

  const drawElement = (_renderObject, _index) => {
    ctx.drawImage(
      _renderObject.loadedImage,
      0,
      0,
      p.config.width,
      p.config.height
    );

    addAttributes(_renderObject);
  };

  const saveImage = (_editionCount) => {
    const url = canvas.toDataURL("image/png");
    const base64Data = url.replace(/^data:image\/png;base64,/, "");
    fs.writeFileSync(
      path.join(
        p.config.outputPath,
        "build",
        "images",
        `${_editionCount}.png`
      ),
      base64Data,
      "base64"
    );
  };

  const addMetadata = (_dna, _edition) => {
    let dateTime = Date.now();
    let tempMetadata = {
      name: `${p.config.name} #${_edition}`,
      description: p.config.description,
      image: `REPLACE/${_edition}.png`,
      edition: _edition,
      date: dateTime,
      attributes: attributesList
    };
    metadataList.push(tempMetadata);
    attributesList = [];
  };

  const saveMetaDataSingleFile = (_editionCount) => {
    let metadata = metadataList.find((meta) => meta.edition === _editionCount);
    fs.writeFileSync(
      path.join(
        p.config.outputPath,
        "build",
        "json",
        `${_editionCount}.json`
      ),
      JSON.stringify(metadata, null, 2)
    );
  };

  const writeMetaData = (_data) => {
    fs.writeFileSync(
      path.join(p.config.outputPath, "build", "json", `_metadata.json`),
      _data
    );
  };

  const startCreating = async () => {
    p.setProgress(0);
    let editionCount = 1;
    let failedCount = 0;
    while (editionCount <= p.config.supply) {
      let newDna = createDna(p.folderNames);
      if (isDnaUnique(dnaList, newDna)) {
        let results = constructLayerToDna(newDna, p.folderNames);
        let loadedElements = [];

        results.forEach((layer) => {
          loadedElements.push(loadLayerImg(layer));
        });

        await Promise.all(loadedElements).then((renderObjectArray) => {
          ctx.clearRect(0, 0, p.config.width, p.config.height);

          renderObjectArray.forEach((renderObject, index) => {
            drawElement(renderObject, index);
          });

          saveImage(editionCount);
          addMetadata(newDna, editionCount);
          saveMetaDataSingleFile(editionCount);

          console.log(`Created edition: ${editionCount}`);
        });

        dnaList.add(filterDNAOptions(newDna));
        editionCount++;
        p.setProgress(editionCount - 1);
      } else {
        console.log("DNA exists!");
        failedCount++;
        if (failedCount >= 1000) {
          console.log(
            `You need more layers or elements to grow your edition to ${p.config.supply} artworks!`
          );
          process.exit();
        }
      }
    }
    writeMetaData(JSON.stringify(metadataList, null, 2));
  };

  // Metadata ====================

  const updateMetadata = () => {
    let rawdata = fs.readFileSync(
      path.join(p.config.outputPath, "build", "json", `_metadata.json`)
    );

    let data = JSON.parse(rawdata);

    data.forEach((item) => {
      item.name = `${p.config.name} #${item.edition}`;
      item.description = p.config.description;
      item.image = `${p.config.baseUri}/${item.edition}.png`;

      fs.writeFileSync(
        path.join(
          p.config.outputPath,
          "build",
          "json",
          `${item.edition}.json`
        ),
        JSON.stringify(item, null, 2)
      );
    });

    fs.writeFileSync(
      path.join(p.config.outputPath, "build", "json", `_metadata.json`),
      JSON.stringify(data, null, 2)
    );

    console.log(`Updated baseUri for images to ===> ${p.config.baseUri}`);
    console.log(
      `Updated description for images to ===> ${p.config.description}`
    );
    console.log(`Updated name prefix for images to ===> ${p.config.name}`);
  };

  const generate = () => {
    p.setStatus("");
    if (p.config.supply <= 0) {
      p.setStatus("Your need to increase the supply.");
      return;
    }

    if (p.folderNames.length === 0) {
      p.setStatus(
        "Make sure to get the folder with only image files in them."
      );
      return;
    }
    buildFolders();
    startCreating();
  };

  const calculateRarities = () => {
    try {

      if (p.rarities.saved) {
        alert('Old rarities going to be removed from json\'s. Please, call again "Set Json Rarities" when finished')
        setJsonRarities(false)
      }

      const metaJson = path.join(
        p.config.outputPath,
        'build',
        'json',
        '_metadata.json'
      )

      const rawData = fs.readFileSync(metaJson, 'utf8')
      const data = JSON.parse(rawData)

      let rarity = p.config.rarity ?? ''
      rarity += '\nUnknown,0,100'

      const rarityRanges = rarity.split('\n').reduce((r, line) => {
        const [label, start, end] = line.split(',')
        r[label] = [parseInt(start), parseInt(end)]
        return r
      }, {})

      const layerConfigurations = [{
        layersOrder: p.folderNames.map(folder => ({
          name: folder.name,
        }))
      }]

      const getLayerElements = (layerName) => p.getElements(`${p.config.inputPath}/${layerName}`)

      const rarityScores = getRarityScores(data, rarityRanges, layerConfigurations, getLayerElements)

      const rarityGroups = groupByRarity(rarityScores)

      p.setRarities({
        items: rarityScores,
        groups: rarityGroups,
        ranges: rarityRanges,
        saved: false
      })
    } catch (error) {
      alert(error.message)
    }
  }

  const setJsonRarities = (value = true) => {
    try {
      const metaJson = path.join(
        p.config.outputPath,
        'build',
        'json',
        '_metadata.json'
      )

      p.rarities.items.forEach((element) => {
        fs.writeFileSync(
          path.join(p.config.outputPath, "build", "json", `${element.element.edition}.json`),
          JSON.stringify(value ? element.nextItem : element.element, null, 2)
        )
      })

      const nextItems = p.rarities.items.map(x => value ? x.nextItem : x.element)

      fs.writeFileSync(
        metaJson,
        JSON.stringify(nextItems)
      )

      p.setRarities(x => ({
        ...x,
        saved: value
      }))

      alert('JSON files has been updated')
    } catch (error) {
      alert(error.message)
    }
  }

  return (
    <aside className={`aside ${p.sideBarOpen && "active"}`}>
      <div className="aside_close-icon">
        <FiX onClick={() => p.toggleSideBar()} />
      </div>
      <div className="aside_list_title">
        <a
          className="aside_img_link"
          target="_blank"
          href="https://hashlips.online/HashLips" rel="noreferrer"
        >
          <img alt="mask" src={mask} width="25" height="25" />
        </a>
        <p>Art Engine</p>
      </div>
      <ul className="aside_list">
        <details className="aside_list_item">
          <summary>Configuration</summary>
          <div>
            {input("Supply", "supply", p.config.supply, "number")}
            {input("Name", "name", p.config.name)}
            {input("Symbol", "symbol", p.config.symbol)}
            {input("Description", "description", p.config.description)}
            {input("Width", "width", p.config.width, "number")}
            {input("Height", "height", p.config.height, "number")}
          </div>
        </details>
        <details className="aside_list_item">
          <summary>Paths</summary>
          {input("Input Path", "inputPath", p.config.inputPath)}
          <button
            className="aside_list_item_button"
            onClick={() => setPath("inputPath")}
          >
            Set Input Path
          </button>
          {input("Output Path", "outputPath", p.config.outputPath)}
          <button
            className="aside_list_item_button"
            onClick={() => setPath("outputPath")}
          >
            Set Output Path
          </button>
        </details>
        <details className="aside_list_item">
          <summary>Layer order</summary>
          <p className="aside_list_item_input_label">Input folders</p>
          <button className="aside_list_item_button" onClick={p.getFolders}>
            Get Folders
          </button>
          {p.folderNames.map((folder, index) => {
            return (
              <SortableItem
                items={p.folderNames}
                id={folder.id}
                key={folder.id}
                swap={swap}
              >
                <div className="aside_list_item_filename_container">
                  <p>{folder.name}</p>
                </div>
              </SortableItem>
            );
          })}
        </details>
        <details className="aside_list_item">
          <summary>Create</summary>
          <p className="aside_list_item_input_label">Images & Metadata</p>
          <button
            className="aside_list_item_button"
            onClick={async () => {
              generate();
            }}
          >
            Generate
          </button>

          <p className="aside_list_item_input_label">Rarities</p>

          {textArea("Rarity Ranges", "rarity", p.config.rarity, "label,start,end\n")}

          <button className="aside_list_item_button" onClick={calculateRarities}>
            Calculate scores and rarities
          </button>

          <button className="aside_list_item_button" onClick={() => setJsonRarities(!p.rarities.saved)}>
            {!p.rarities.saved ? 'Set JSON Rarities' : 'Remove JSON Rarities'}
          </button>

          {input("IPFS", "baseUri", p.config.baseUri)}
          <button
            className="aside_list_item_button"
            onClick={async () => {
              updateMetadata();
            }}
          >
            Update Metadata
          </button>
        </details>
      </ul>
    </aside>
  );
}

export default Aside;
