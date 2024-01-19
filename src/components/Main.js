import Table from 'cli-table';
import { useMemo } from "react";
import Canvas from "./Canvas";
import "./Main.css";

function Main(p) {
  const raritiesOutput = useMemo(() => {
    const itemsTable = new Table({
      head: ['Item', 'Id', 'RarityRank', 'RarityLabel'],
      colWidths: [30, 20, 20, 20]
    });

    p.rarities.items.forEach((rarityScore) => {
      itemsTable.push([
        rarityScore.element.name,
        rarityScore.element.edition,
        rarityScore.score,
        rarityScore.nextItem.rarity
      ])
    })

    itemsTable.sort((a, b) => (a[2] > b[2]) ? -1 : 1)

    const raritiesTable = new Table({
      head: ['Label', 'Items amount', 'Range'],
      colWidths: [30, 20, 50]
    });


    Object.entries(p.rarities.groups).forEach(([rarityLabel, rarityGroup]) => {
      raritiesTable.push([
        rarityLabel,
        rarityGroup.length,
        p.rarities.ranges[rarityLabel].join('...'),
      ])
    })

    raritiesTable.sort((a, b) => (a[1] > b[1]) ? 1 : -1)
    
    return itemsTable.toString() + '\n\n' + raritiesTable.toString()

  }, [p.rarities])

  return (
    <main className="main">
      <div className="main_info">
        <p>Supply: {p.config.supply}</p>
        <p>Name: {p.config.name}</p>
        <p>Symbol: {p.config.symbol}</p>
        <p>Description: {p.config.description}</p>
      </div>
      <div className="main_cards">
        <div className="card">
          <Canvas folderNames={p.folderNames} />
        </div>
        <div className="card">
          <p className="card_tree_title">Tree</p>
          {p.folderNames.length > 0 ? (
            p.folderNames.map((item, index) => {
              return (
                <div key={`folderName-${index}`}>
                  <p className="card_tree_item">{item.name}</p>
                  {item.elements.map((element) => {
                    return (
                      <p className="card_tree_sub_item_title">
                        ---{element.name}
                        <sup>{element.weight}</sup>
                      </p>
                    );
                  })}
                </div>
              );
            })
          ) : (
            <p className="card_tree_item">
              The tree is empty. Please set the configurations.
            </p>
          )}
        </div>
      </div>
      <div className="log_info">
        <p className="log_info_title">
          Progress: {p.progress}/{p.config.supply}
        </p>
        <progress
          style={{
            width: "100%",
            height: "20px",
            marginTop: 5,
            backgroundColor: "lightGreen",
          }}
          value={p.progress}
          max={p.config.supply}
        ></progress>
        <p className="log_info_title">Status:</p>
        <p
          className="log_info_text"
          style={{ color: p.status ? "red" : "lightGreen" }}
        >
          {p.status !== "" ? p.status : "Everything look good"}
        </p>
      </div>

      <div className="log_info">
        <p className="log_info_title">
          Rarities output
        </p>

        <p
          className="log_info_text"
          style={{ color: p.status ? "red" : "lightGreen", fontSize: 12 }}
        >
          <pre>
            {raritiesOutput}
          </pre>
        </p>
      </div>
    </main>
  );
}

export default Main;
