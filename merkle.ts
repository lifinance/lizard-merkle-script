import fs from "fs";
import { utils } from "ethers";
import { MerkleTree } from "merkletreejs";

const readLines = fs.readFileSync("claims.csv").toString().split("\n");
const rawClaims = readLines.map((line) => {
  let parts = line.split(",");
  if (parts.length < 3) {
    return undefined;
  }
  return [parts[0], utils.parseEther(parts[1]), parts[2]];
});

const leafs = [];
const output: any = {
  merkleRoot: "",
  claims: [],
};

for (let claim of rawClaims) {
  if (claim === undefined) {
    continue;
  }
  leafs.push(
    utils.solidityPack(
      ["address", "uint256", "string"],
      [claim[0], claim[1], claim[2]]
    )
  );
}

const tree = new MerkleTree(leafs.map(utils.keccak256), utils.keccak256, {
  sortPairs: true,
});

output.merkleRoot = tree.getRoot().toString("hex");

for (let claim of rawClaims) {
  if (claim === undefined) {
    continue;
  }
  let hash = utils.solidityPack(
    ["address", "uint256", "string"],
    [claim[0], claim[1], claim[2]]
  );
  output.claims.push({
    address: claim[0],
    amount: claim[1].toString(),
    series: claim[2],
    proof: tree.getHexProof(utils.keccak256(hash)),
  });
}

console.log(`New Merkle Root is ${output.merkleRoot}`);
console.log("Output written to 'claims.json'");

fs.writeFileSync("claims.json", JSON.stringify(output));
