import { Spec } from "@specron/spec";
import { BigInteger } from "javascript-biginteger";

/**
 * Spec context interfaces.
 */

interface Data {
  nfToken?: any;
  owner?: string;
  bob?: string;
  jane?: string;
  sara?: string;
  zeroAddress?: string;
  id1?: string;
  id2: string;
  id3?: string;
  uri1?: string;
  uri2?: string;
  uri3?: string;
  memo1?: string;
  memo2?: string;
  memo3?: string;
  pressing1: string;
  pressing2: string;
  pressing3: string;
  series1: string;
  series2: string;
  series3: string;
  price1: string;
  price2: string;
  price3: string;
}

/**
 * Spec stack instances.
 */

const spec = new Spec<Data>();

export default spec;

function makeId(edition: number | string, series: number | string, pressing: number | string) {
  return `${(parseInt(`${edition}`, 10) << 24) |
    (parseInt(`${series}`, 10) << 16) |
    parseInt(`${pressing}`, 10)}`;
}

const NAME = "Squeeze Cheese";
const SYMBOL = "SQCHZ";
const BASE_URL = "https://google.com/";

spec.beforeEach(async ctx => {
  const accounts = await ctx.web3.eth.getAccounts();
  ctx.set("owner", accounts[0]);
  ctx.set("bob", accounts[1]);
  ctx.set("jane", accounts[2]);
  ctx.set("sara", accounts[3]);
  ctx.set("zeroAddress", "0x0000000000000000000000000000000000000000");
});

spec.beforeEach(async ctx => {
  ctx.set("id1", makeId(1, 1, 1));
  ctx.set("id2", makeId(1, 1, 2));
  ctx.set("id3", makeId(1, 1, 3));
  ctx.set("uri1", "1.json");
  ctx.set("uri2", "2.json");
  ctx.set("uri3", "3.json");
  ctx.set("memo1", "memo1");
  ctx.set("memo2", "memo2");
  ctx.set("memo3", "memo3");
  ctx.set("series1", "1");
  ctx.set("series2", "1");
  ctx.set("series3", "1");
  ctx.set("pressing1", "1");
  ctx.set("pressing2", "2");
  ctx.set("pressing3", "3");
  ctx.set("price1", "1000");
  ctx.set("price2", "1000");
  ctx.set("price3", "1000");
});

spec.beforeEach(async ctx => {
  const nfToken = await ctx.deploy({
    src: "./build/geopogs.json",
    contract: "GeoPogs",
    args: [NAME, SYMBOL, BASE_URL]
  });
  ctx.set("nfToken", nfToken);
});

spec.test("correctly checks all the supported interfaces", async ctx => {
  const nftoken = ctx.get("nfToken");
  const nftokenInterface = await nftoken.instance.methods.supportsInterface("0x80ac58cd").call();
  const nftokenMetadataInterface = await nftoken.instance.methods
    .supportsInterface("0x5b5e139f")
    .call();
  const nftokenEnumerableInterface = await nftoken.instance.methods
    .supportsInterface("0x780e9d63")
    .call();
  ctx.is(nftokenInterface, true);
  ctx.is(nftokenMetadataInterface, true);
  ctx.is(nftokenEnumerableInterface, true);
});

spec.test("returns the correct issuer name", async ctx => {
  const nftoken = ctx.get("nfToken");
  const name = await nftoken.instance.methods.name().call();

  ctx.is(name, NAME);
});

spec.test("returns the correct issuer symbol", async ctx => {
  const nftoken = ctx.get("nfToken");
  const symbol = await nftoken.instance.methods.symbol().call();

  ctx.is(symbol, SYMBOL);
});

spec.test("updating base URI", async ctx => {
  const nftoken = ctx.get("nfToken");
  const owner = ctx.get("owner");
  const bob = ctx.get("bob");
  const id1 = ctx.get("id1");
  const memo1 = ctx.get("memo1");
  const uri1 = ctx.get("uri1");
  const series1 = ctx.get("series1");
  const pressing1 = ctx.get("pressing1");
  const price1 = ctx.get("price1");

  await nftoken.instance.methods
    .mint(bob, series1, pressing1, price1, memo1, uri1)
    .send({ from: owner });
  const tokenURI = await nftoken.instance.methods.tokenURI(id1).call();
  ctx.is(tokenURI, BASE_URL + uri1);

  const newBaseUrl = "https://yahoo.com/";

  await ctx.reverts(
    () => nftoken.instance.methods.setBaseUri(newBaseUrl).call({ from: bob }),
    "018001"
  );

  await nftoken.instance.methods.setBaseUri(newBaseUrl).send({ from: owner });
  const updatedTokenURI = await nftoken.instance.methods.tokenURI(id1).call();

  ctx.is(updatedTokenURI, newBaseUrl + uri1);
});

spec.test("returns the correct NFT id 1 url", async ctx => {
  const nftoken = ctx.get("nfToken");
  const owner = ctx.get("owner");
  const bob = ctx.get("bob");
  const id1 = ctx.get("id1");
  const memo1 = ctx.get("memo1");
  const uri1 = ctx.get("uri1");
  const series1 = ctx.get("series1");
  const pressing1 = ctx.get("pressing1");
  const price1 = ctx.get("price1");

  await nftoken.instance.methods
    .mint(bob, series1, pressing1, price1, memo1, uri1)
    .send({ from: owner });
  const tokenURI = await nftoken.instance.methods.tokenURI(id1).call();
  ctx.is(tokenURI, BASE_URL + uri1);
});

spec.test("returns the correct NFT id 1 series and pressing", async ctx => {
  const nftoken = ctx.get("nfToken");
  const owner = ctx.get("owner");
  const bob = ctx.get("bob");
  const id1 = ctx.get("id1");
  const memo1 = ctx.get("memo1");
  const uri1 = ctx.get("uri1");
  const series1 = ctx.get("series1");
  const pressing1 = ctx.get("pressing1");
  const price1 = ctx.get("price1");

  await nftoken.instance.methods
    .mint(bob, series1, pressing1, price1, memo1, uri1)
    .send({ from: owner });
  const tokenSeries = await nftoken.instance.methods.tokenSeries(id1).call();
  const tokenPressing = await nftoken.instance.methods.tokenPressing(id1).call();
  ctx.is(tokenSeries, series1);
  ctx.is(tokenPressing, pressing1);
});

spec.test("throws when trying to get URI of invalid NFT ID", async ctx => {
  const nftoken = ctx.get("nfToken");
  const id1 = ctx.get("id1");

  await ctx.reverts(() => nftoken.instance.methods.tokenURI(id1).call(), "003002");
});

spec.test("correctly mints a NFT", async ctx => {
  const nftoken = ctx.get("nfToken");
  const owner = ctx.get("owner");
  const bob = ctx.get("bob");
  const memo1 = ctx.get("memo1");
  const uri1 = ctx.get("uri1");
  const series1 = ctx.get("series1");
  const pressing1 = ctx.get("pressing1");
  const price1 = ctx.get("price1");

  const logs = await nftoken.instance.methods
    .mint(bob, series1, pressing1, price1, memo1, uri1)
    .send({ from: owner });
  ctx.not(logs.events.Transfer, undefined);
  const count = await nftoken.instance.methods.balanceOf(bob).call();
  ctx.is(count.toString(), "1");
  const totalSupply = await nftoken.instance.methods.totalSupply().call();
  ctx.is(totalSupply.toString(), "1");
});

spec.test("returns the correct token by index", async ctx => {
  const nftoken = ctx.get("nfToken");
  const owner = ctx.get("owner");
  const bob = ctx.get("bob");
  const sara = ctx.get("sara");
  const series1 = ctx.get("series1");
  const series2 = ctx.get("series2");
  const series3 = ctx.get("series3");
  const pressing1 = ctx.get("pressing1");
  const pressing2 = ctx.get("pressing2");
  const pressing3 = ctx.get("pressing3");
  const price1 = ctx.get("price1");
  const price2 = ctx.get("price2");
  const price3 = ctx.get("price3");
  const memo1 = ctx.get("memo1");
  const memo2 = ctx.get("memo2");
  const memo3 = ctx.get("memo3");
  const uri1 = ctx.get("uri1");
  const uri2 = ctx.get("uri2");
  const uri3 = ctx.get("uri3");

  const id1 = ctx.get("id1");
  const id2 = ctx.get("id2");
  const id3 = ctx.get("id3");

  await nftoken.instance.methods
    .mint(bob, series1, pressing1, price1, memo1, uri1)
    .send({ from: owner });
  await nftoken.instance.methods
    .mint(bob, series2, pressing2, price2, memo2, uri2)
    .send({ from: owner });
  await nftoken.instance.methods
    .mint(sara, series3, pressing3, price3, memo3, uri3)
    .send({ from: owner });

  const tokenIndex0 = await nftoken.instance.methods.tokenByIndex(0).call();
  const tokenIndex1 = await nftoken.instance.methods.tokenByIndex(1).call();
  const tokenIndex2 = await nftoken.instance.methods.tokenByIndex(2).call();

  ctx.is(tokenIndex0, id1);
  ctx.is(tokenIndex1, id2);
  ctx.is(tokenIndex2, id3);
});

spec.test("throws when trying to get token by non-existing index", async ctx => {
  const nftoken = ctx.get("nfToken");
  const owner = ctx.get("owner");
  const bob = ctx.get("bob");
  const memo1 = ctx.get("memo1");
  const uri1 = ctx.get("uri1");
  const series1 = ctx.get("series1");
  const pressing1 = ctx.get("pressing1");
  const price1 = ctx.get("price1");

  await nftoken.instance.methods
    .mint(bob, series1, pressing1, price1, memo1, uri1)
    .send({ from: owner });
  await ctx.reverts(() => nftoken.instance.methods.tokenByIndex(1).call(), "005007");
});

spec.test("returns the correct token of owner by index", async ctx => {
  const nftoken = ctx.get("nfToken");
  const owner = ctx.get("owner");
  const bob = ctx.get("bob");
  const sara = ctx.get("sara");
  const series1 = ctx.get("series1");
  const series2 = ctx.get("series2");
  const series3 = ctx.get("series3");
  const pressing1 = ctx.get("pressing1");
  const pressing2 = ctx.get("pressing2");
  const pressing3 = ctx.get("pressing3");
  const price1 = ctx.get("price1");
  const price2 = ctx.get("price2");
  const price3 = ctx.get("price3");
  const memo1 = ctx.get("memo1");
  const memo2 = ctx.get("memo2");
  const memo3 = ctx.get("memo3");
  const uri1 = ctx.get("uri1");
  const uri2 = ctx.get("uri2");
  const uri3 = ctx.get("uri3");

  const id1 = ctx.get("id1");
  const id2 = ctx.get("id2");
  const id3 = ctx.get("id3");

  await nftoken.instance.methods
    .mint(bob, series1, pressing1, price1, memo1, uri1)
    .send({ from: owner });
  await nftoken.instance.methods
    .mint(bob, series2, pressing2, price2, memo2, uri2)
    .send({ from: owner });
  await nftoken.instance.methods
    .mint(sara, series3, pressing3, price3, memo3, uri3)
    .send({ from: owner });

  const tokenOwnerIndex1 = await nftoken.instance.methods.tokenOfOwnerByIndex(bob, 1).call();
  ctx.is(tokenOwnerIndex1, id2);
});

spec.test("throws when trying to get token of owner by non-existing index", async ctx => {
  const nftoken = ctx.get("nfToken");
  const owner = ctx.get("owner");
  const bob = ctx.get("bob");
  const memo1 = ctx.get("memo1");
  const uri1 = ctx.get("uri1");
  const series1 = ctx.get("series1");
  const pressing1 = ctx.get("pressing1");
  const price1 = ctx.get("price1");

  await nftoken.instance.methods
    .mint(bob, series1, pressing1, price1, memo1, uri1)
    .send({ from: owner });
  await ctx.reverts(() => nftoken.instance.methods.tokenOfOwnerByIndex(bob, 1).call(), "005007");
});

spec.test("send", async ctx => {
  const nftoken = ctx.get("nfToken");
  const owner = ctx.get("owner");
  const bob = ctx.get("bob");
  const sara = ctx.get("sara");
  const series1 = ctx.get("series1");
  const pressing1 = ctx.get("pressing1");
  const price1 = ctx.get("price1");
  const memo1 = ctx.get("memo1");
  const uri1 = ctx.get("uri1");

  const id1 = ctx.get("id1");

  const contractAddress = nftoken.instance._address;

  await nftoken.instance.methods
    .mint(contractAddress, series1, pressing1, price1, memo1, uri1)
    .send({ from: owner });
  await nftoken.instance.methods.buy(id1).send({ from: bob, value: price1 });

  await ctx.reverts(() => nftoken.instance.methods.send(sara, price1).send({ from: bob }));
  await nftoken.instance.methods.send(sara, price1).send({ from: owner });
});

spec.test("tokens minted for sale immediately can be bought", async ctx => {
  const nftoken = ctx.get("nfToken");
  const owner = ctx.get("owner");
  const bob = ctx.get("bob");
  const series1 = ctx.get("series1");
  const pressing1 = ctx.get("pressing1");
  const price1 = ctx.get("price1");
  const memo1 = ctx.get("memo1");
  const uri1 = ctx.get("uri1");

  const id1 = ctx.get("id1");

  const contractAddress = nftoken.instance._address;

  // Mint token to contract
  await nftoken.instance.methods
    .mint(contractAddress, series1, pressing1, price1, memo1, uri1)
    .send({ from: owner });

  // Verify contract is owner
  ctx.is(contractAddress, await nftoken.instance.methods.ownerOf(id1).call());

  // Bob buys token
  await nftoken.instance.methods.buy(id1).send({ from: bob, value: price1 });

  // Verify bob is owner
  const newOwner = await nftoken.instance.methods.ownerOf(id1).call();
  ctx.is(newOwner, bob);

  // Verify contract has proceeds of sale
  const contractBalance = await ctx.web3.eth.getBalance(contractAddress);
  ctx.is(contractBalance, price1);
});

spec.test("token resale", async ctx => {
  const nftoken = ctx.get("nfToken");
  const owner = ctx.get("owner");
  const bob = ctx.get("bob");
  const sara = ctx.get("sara");
  const series1 = ctx.get("series1");
  const pressing1 = ctx.get("pressing1");
  const price1 = ctx.get("price1");
  const memo1 = ctx.get("memo1");
  const uri1 = ctx.get("uri1");

  const id1 = ctx.get("id1");

  const contractAddress = nftoken.instance._address;
  const resalePrice = 2000;

  // Mint token to contract
  await nftoken.instance.methods
    .mint(contractAddress, series1, pressing1, price1, memo1, uri1)
    .send({ from: owner });

  ctx.is("" + price1, await nftoken.instance.methods.tokenPrice(id1).call());

  // Bob buys token
  await nftoken.instance.methods.buy(id1).send({ from: bob, value: price1 });

  // Double-buy fails
  await ctx.reverts(
    () => nftoken.instance.methods.buy(id1).send({ from: bob, value: price1 }),
    "300001"
  );

  // Bob lists token for sale
  await nftoken.instance.methods.offerForSale(id1, resalePrice).send({ from: bob });

  const bobBalanceBeforeSale = await ctx.web3.eth.getBalance(bob);
  const contractBalanceBeforeSale = await ctx.web3.eth.getBalance(contractAddress);

  // Sara buys token
  await nftoken.instance.methods.buy(id1).send({ from: sara, value: resalePrice });

  // Verify sara is owner
  const newOwner = await nftoken.instance.methods.ownerOf(id1).call();
  ctx.is(newOwner, sara);

  // Verify contract has proceeds of sale
  const contractBalanceAfterSale = await ctx.web3.eth.getBalance(contractAddress);
  const contractBalanceChange = contractBalanceAfterSale - contractBalanceBeforeSale;
  ctx.is(contractBalanceChange > 0, true);
  ctx.is(contractBalanceChange < resalePrice * 0.015, true);

  const bobBalanceAfterSale = await ctx.web3.eth.getBalance(bob);
  const bobBalanceChange = BigInteger(bobBalanceAfterSale)
    .subtract(BigInteger(bobBalanceBeforeSale))
    .toJSValue();
  ctx.is(bobBalanceChange > resalePrice * 0.985, true);
});

spec.test("removing token from sale", async ctx => {
  const nftoken = ctx.get("nfToken");
  const owner = ctx.get("owner");
  const bob = ctx.get("bob");
  const sara = ctx.get("sara");
  const series1 = ctx.get("series1");
  const pressing1 = ctx.get("pressing1");
  const price1 = ctx.get("price1");
  const memo1 = ctx.get("memo1");
  const uri1 = ctx.get("uri1");

  const id1 = ctx.get("id1");

  // Mint token to contract
  await nftoken.instance.methods
    .mint(bob, series1, pressing1, price1, memo1, uri1)
    .send({ from: owner });

  // Bob buys token
  await nftoken.instance.methods.removeFromSale(id1).send({ from: bob });

  // Sara's buy fails
  await ctx.reverts(
    () => nftoken.instance.methods.buy(id1).send({ from: sara, value: price1 }),
    "300001"
  );

  // Bob relists token
  await nftoken.instance.methods.offerForSale(id1, 5000).send({ from: bob });

  // Sara buys token
  await nftoken.instance.methods.buy(id1).send({ from: sara, value: 5000 });

  // Verify sara is owner
  const newOwner = await nftoken.instance.methods.ownerOf(id1).call();
  ctx.is(newOwner, sara);
});

spec.test("throws when trying to buy not-for-sale token", async ctx => {
  const nftoken = ctx.get("nfToken");
  const owner = ctx.get("owner");
  const bob = ctx.get("bob");
  const series1 = ctx.get("series1");
  const pressing1 = ctx.get("pressing1");
  const price1 = ctx.get("price1");
  const memo1 = ctx.get("memo1");
  const uri1 = ctx.get("uri1");

  const id1 = ctx.get("id1");

  const contractAddress = nftoken.instance._address;

  // Mint token to contract
  await nftoken.instance.methods
    .mint(contractAddress, series1, pressing1, 0, memo1, uri1)
    .send({ from: owner });

  await ctx.reverts(
    () => nftoken.instance.methods.buy(id1).send({ from: bob, value: 50 }),
    "300001"
  );
});

spec.test("throws when trying to buy for too little", async ctx => {
  const nftoken = ctx.get("nfToken");
  const owner = ctx.get("owner");
  const bob = ctx.get("bob");
  const series1 = ctx.get("series1");
  const pressing1 = ctx.get("pressing1");
  const price1 = ctx.get("price1");
  const memo1 = ctx.get("memo1");
  const uri1 = ctx.get("uri1");

  const id1 = ctx.get("id1");

  const contractAddress = nftoken.instance._address;

  // Mint token to contract
  await nftoken.instance.methods
    .mint(contractAddress, series1, pressing1, price1, memo1, uri1)
    .send({ from: owner });

  await ctx.reverts(
    () => nftoken.instance.methods.buy(id1).send({ from: bob, value: parseInt(price1, 10) - 1 }),
    "300002"
  );
});

spec.test("cross-chain address pointer", async ctx => {
  const nftoken = ctx.get("nfToken");
  const owner = ctx.get("owner");
  const bob = ctx.get("bob");

  await nftoken.instance.methods.setCrossChainAddress(bob).send({ from: owner });
  ctx.is(await nftoken.instance.methods.crossChainAddress().call(), bob);
});

spec.test("list all owned by contract", async ctx => {
  const nftoken = ctx.get("nfToken");
  const owner = ctx.get("owner");

  const contractAddress = nftoken.instance._address;

  await nftoken.instance.methods
    .mint(contractAddress, 1, 1, 1000, 'memo', 'uri')
    .send({ from: owner });

  await nftoken.instance.methods
    .mint(contractAddress, 1, 2, 1000, 'memo', 'uri')
    .send({ from: owner });

  const contractOwned = await nftoken.instance.methods.contractOwned().call();
  ctx.is(contractOwned.length, 2);
});

spec.test("owner operatorship", async ctx => {
  const nftoken = ctx.get("nfToken");
  const owner = ctx.get("owner");
  const bob = ctx.get("bob");
  const series1 = ctx.get("series1");
  const pressing1 = ctx.get("pressing1");
  const price1 = ctx.get("price1");
  const memo1 = ctx.get("memo1");
  const uri1 = ctx.get("uri1");

  const id1 = ctx.get("id1");

  const contractAddress = nftoken.instance._address;

  // Mint token to contract
  await nftoken.instance.methods
    .mint(contractAddress, series1, pressing1, price1, memo1, uri1)
    .send({ from: owner });

  await ctx.reverts(
    () => nftoken.instance.methods.transferFrom(contractAddress, bob, id1).send({ from: bob }),
    "003004"
  );

  await nftoken.instance.methods.transferFrom(contractAddress, bob, id1).send({ from: owner });
  // Verify bob is owner
  const newOwner = await nftoken.instance.methods.ownerOf(id1).call();
  ctx.is(newOwner, bob);
});

spec.test("owner transfer", async ctx => {
  const nftoken = ctx.get("nfToken");
  const owner = ctx.get("owner");
  const bob = ctx.get("bob");
  const sara = ctx.get("sara");
  const series1 = ctx.get("series1");
  const pressing1 = ctx.get("pressing1");
  const price1 = ctx.get("price1");
  const memo1 = ctx.get("memo1");
  const uri1 = ctx.get("uri1");

  const id1 = ctx.get("id1");

  const contractAddress = nftoken.instance._address;

  await nftoken.instance.methods
    .mint(contractAddress, series1, pressing1, price1, memo1, uri1)
    .send({ from: owner });

  await ctx.reverts(
    () => nftoken.instance.methods.transferFrom(contractAddress, sara, id1).send({ from: bob }),
    "003004"
  );

  await ctx.reverts(
    () => nftoken.instance.methods.transferOwnership(bob).send({ from: bob }),
    "018001"
  );

  await nftoken.instance.methods.transferOwnership(bob).send({ from: owner });
  await ctx.reverts(
    () => nftoken.instance.methods.transferFrom(contractAddress, sara, id1).send({ from: owner }),
    "003004"
  );
  await nftoken.instance.methods.transferFrom(contractAddress, sara, id1).send({ from: bob });

  const newOwner = await nftoken.instance.methods.ownerOf(id1).call();
  ctx.is(newOwner, sara);
});

spec.test("editions", async ctx => {
  const nftoken = ctx.get("nfToken");
  const owner = ctx.get("owner");
  const bob = ctx.get("bob");
  const sara = ctx.get("sara");
  const series1 = ctx.get("series1");
  const series2 = ctx.get("series2");
  const series3 = ctx.get("series3");
  const pressing1 = ctx.get("pressing1");
  const pressing2 = ctx.get("pressing2");
  const pressing3 = ctx.get("pressing3");
  const price1 = ctx.get("price1");
  const price2 = ctx.get("price2");
  const price3 = ctx.get("price3");
  const memo1 = ctx.get("memo1");
  const memo2 = ctx.get("memo2");
  const memo3 = ctx.get("memo3");
  const uri1 = ctx.get("uri1");
  const uri2 = ctx.get("uri2");
  const uri3 = ctx.get("uri3");

  const id1 = ctx.get("id1");
  const id2 = ctx.get("id2");

  await nftoken.instance.methods
    .mint(bob, series1, pressing1, price1, memo1, uri1)
    .send({ from: owner });

  // Proceed ~3.5 days
  await new Promise(r =>
    ctx.web3.currentProvider.sendAsync(
      { jsonrpc: "2.0", method: "evm_increaseTime", params: [300000], id: 0 },
      r
    )
  );
  await new Promise(r =>
    ctx.web3.currentProvider.sendAsync({ jsonrpc: "2.0", method: "evm_mine", params: [], id: 0 }, r)
  );

  await nftoken.instance.methods
    .mint(sara, series2, pressing2, price2, memo2, uri2)
    .send({ from: owner });

  // Proceed ~3.5 days
  await new Promise(r =>
    ctx.web3.currentProvider.sendAsync(
      { jsonrpc: "2.0", method: "evm_increaseTime", params: [310000], id: 1 },
      r
    )
  );
  await new Promise(r =>
    ctx.web3.currentProvider.sendAsync({ jsonrpc: "2.0", method: "evm_mine", params: [], id: 1 }, r)
  );

  await nftoken.instance.methods
    .mint(bob, series3, pressing3, price3, memo3, uri3)
    .send({ from: owner });

  ctx.is("1", await nftoken.instance.methods.tokenEdition(id1).call());
  ctx.is("1", await nftoken.instance.methods.tokenEdition(id2).call());
  ctx.is("2", await nftoken.instance.methods.tokenEdition(makeId(2, series3, pressing3)).call());
});

spec.test("minting limits", async ctx => {
  const nftoken = ctx.get("nfToken");
  const owner = ctx.get("owner");
  const price1 = ctx.get("price1");
  const memo1 = ctx.get("memo1");
  const uri1 = ctx.get("uri1");

  const contractAddress = nftoken.instance._address;
  const tributeSeries = 2;
  const normalSeries = 8;

  await ctx.reverts(
    () =>
      nftoken.instance.methods
        .mint(contractAddress, normalSeries, 0, price1, memo1, uri1)
        .send({ from: owner }),
    "300004"
  );
  for (let n = 1; n <= 42; n++) {
    await nftoken.instance.methods
      .mint(contractAddress, normalSeries, n, price1, memo1, uri1)
      .send({ from: owner });
  }
  await ctx.reverts(
    () =>
      nftoken.instance.methods
        .mint(contractAddress, normalSeries, 43, price1, memo1, uri1)
        .send({ from: owner }),
    "300004"
  );

  await ctx.reverts(
    () =>
      nftoken.instance.methods
        .mint(contractAddress, tributeSeries, 0, price1, memo1, uri1)
        .send({ from: owner }),
    "300004"
  );
  for (let n = 1; n <= 21; n++) {
    await nftoken.instance.methods
      .mint(contractAddress, tributeSeries, n, price1, memo1, uri1)
      .send({ from: owner });
  }
  await ctx.reverts(
    () =>
      nftoken.instance.methods
        .mint(contractAddress, tributeSeries, 22, price1, memo1, uri1)
        .send({ from: owner }),
    "300004"
  );
});
