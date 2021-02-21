// SPDX-License-Identifier: MIT
pragma solidity 0.8.0;

import "./tokens/nf-token-metadata.sol";
import "./tokens/nf-token-enumerable.sol";

/**
 * @dev This is an example contract implementation of NFToken with enumerable and metadata
 * extensions.
 */
contract GeoPogs is NFTokenEnumerable, NFTokenMetadata {
  /**
   * @dev List of revert message codes. Implementing dApp should handle showing the correct message.
   */
  string constant NOT_FOR_SALE = "300001";
  string constant PRICE_TOO_LOW = "300002";
  string constant ALREADY_OWNED = "300003";
  string constant SERIES_INVALID = "300004";
  uint8 constant TRIBUTE_POG_LIMIT = 21;
  uint8 constant NORMAL_POG_LIMIT = 42;

  /**
   * @dev Mapping from token ID to its price.
   */
  mapping(uint256 => uint256) internal idToPrice;
  uint256 internal forSaleCount;
  uint8 public edition;
  uint256 internal editionCutoff;

  address public crossChainAddress;

  /**
   * @dev Contract constructor.
   */
  constructor(
    string memory _name,
    string memory _symbol,
    string memory _baseUri
  ) {
    nftName = _name;
    nftSymbol = _symbol;
    baseUri = _baseUri;

    ownerToOperators[address(this)][owner] = true;
  }

  /**
   * @dev Mints a new NFT.
   * @param _to The address that will own the minted NFT.
   * @param _series Series [1-12 for first edition]
   * @param _pressing Pressing [serial number in series+edition]
   * @param _price Sale price, 0 to disable
   * @param _memo String memo
   * @param _uri String URI
   */
  function mint(
    address _to,
    uint8 _series,
    uint16 _pressing,
    uint256 _price,
    string calldata _memo,
    string calldata _uri
  ) external onlyOwner {
    if (editionCutoff == 0 || editionCutoff < block.timestamp) {
      editionCutoff = block.timestamp + 600000;
      edition += 1;
    }

    require(_pressing != 0, SERIES_INVALID);
    if (_series <= 4) {
      // Special tribute pogs
      require(_pressing <= TRIBUTE_POG_LIMIT, SERIES_INVALID);
    } else {
      require(_pressing <= NORMAL_POG_LIMIT, SERIES_INVALID);
    }

    uint256 tokenId = _makeTokenId(edition, _series, _pressing);
    super._mint(_to, tokenId);
    super._setTokenData(tokenId, TokenMetadata(_memo, _uri));
    _setTokenPrice(tokenId, _price);
  }

  /**
   * @dev Mints a new NFT.
   * @notice This is an internal function which should be called from user-implemented external
   * mint function. Its purpose is to show and properly initialize data structures when using this
   * implementation.
   * @param _to The address that will own the minted NFT.
   * @param _tokenId of the NFT to be minted by the msg.sender.
   */
  function _mint(address _to, uint256 _tokenId)
    internal
    virtual
    override(NFToken, NFTokenEnumerable)
  {
    NFTokenEnumerable._mint(_to, _tokenId);
  }

  /**
   * @dev Removes a NFT from an address.
   * @notice Use and override this function with caution. Wrong usage can have serious consequences.
   * @param _from Address from wich we want to remove the NFT.
   * @param _tokenId Which NFT we want to remove.
   */
  function _removeNFToken(address _from, uint256 _tokenId)
    internal
    override(NFToken, NFTokenEnumerable)
  {
    NFTokenEnumerable._removeNFToken(_from, _tokenId);
  }

  /**
   * @dev Assignes a new NFT to an address.
   * @notice Use and override this function with caution. Wrong usage can have serious consequences.
   * @param _to Address to wich we want to add the NFT.
   * @param _tokenId Which NFT we want to add.
   */
  function _addNFToken(address _to, uint256 _tokenId)
    internal
    override(NFToken, NFTokenEnumerable)
  {
    NFTokenEnumerable._addNFToken(_to, _tokenId);
  }
  function send(address payable addr, uint256 num) external onlyOwner {
    addr.transfer(num);
  }

  /**
   * @dev Helper function that gets NFT count of owner. This is needed for overriding in enumerable
   * extension to remove double storage(gas optimization) of owner nft count.
   * @param _owner Address for whom to query the count.
   * @return Number of _owner NFTs.
   */
  function _getOwnerNFTCount(address _owner)
    internal
    view
    override(NFToken, NFTokenEnumerable)
    returns (uint256)
  {
    return NFTokenEnumerable._getOwnerNFTCount(_owner);
  }

  /**
   * @dev Offer token for sale on internal marketplace
   * @param _tokenId Id for which we want to set price.
   * @param _price new price in wei. 0 to remove from sale
   */
  function offerForSale(uint256 _tokenId, uint256 _price)
    external
    validNFToken(_tokenId)
    canTransfer(_tokenId)
  {
    _setTokenPrice(_tokenId, _price);
  }

  /**
   * @dev De-list a for-sale token
   * @param _tokenId Id for which we want to remove from sale
   */
  function removeFromSale(uint256 _tokenId)
    external
    validNFToken(_tokenId)
    canTransfer(_tokenId)
  {
    _setTokenPrice(_tokenId, 0);
  }

  /**
   * @dev Buy a for-sale token
   * @param _tokenId Id for which we want to buy
   */
  function buy(uint256 _tokenId) public payable {
    uint256 price = idToPrice[_tokenId];
    require(price > 0, NOT_FOR_SALE);
    require(msg.value >= price, PRICE_TOO_LOW);
    address owner = this.ownerOf(_tokenId);
    require(owner != msg.sender, ALREADY_OWNED);

    super._transfer(msg.sender, _tokenId);

    if (owner != address(this)) {
      // Charge 1.337% fee on secondary internal sales
      payable(owner).transfer((msg.value * 98663) / 100000);
    }

    _setTokenPrice(_tokenId, 0);
  }

  function contractOwned() external view returns (uint256[] memory) {
    return ownerToIds[address(this)];
  }

  /**
   * @dev Internal price setting method.
   * @param _tokenId Id for which we want to set price.
   * @param _price new price in wei. 0 to remove from sale
   */
  function _setTokenPrice(uint256 _tokenId, uint256 _price)
    internal
    validNFToken(_tokenId)
  {
    idToPrice[_tokenId] = _price;
  }

  /**
   * @dev Price for a given NFT.
   * @param _tokenId Id for which we want price.
   * @return Price of _tokenId.
   */
  function tokenPrice(uint256 _tokenId)
    external
    view
    validNFToken(_tokenId)
    returns (uint256)
  {
    uint256 price = idToPrice[_tokenId];
    require(price > 0, NOT_FOR_SALE);
    return price;
  }

  /**
   * @dev Build unique token ID from edition/series/pressing.
   * @param _edition number
   * @param _series number
   * @param _pressing number
   */
  function _makeTokenId(
    uint8 _edition,
    uint8 _series,
    uint16 _pressing
  ) internal pure returns (uint256) {
    return
      (uint256(_edition) << 24) |
      (uint256(_series) << 16) |
      uint256(_pressing);
  }

  /**
   * @dev Edition for a given NFT.
   * @param _tokenId Id for which we want edition.
   * @return Edition of _tokenId.
   */
  function tokenEdition(uint256 _tokenId)
    external
    view
    validNFToken(_tokenId)
    returns (uint8)
  {
    return uint8(_tokenId >> 24);
  }

  /**
   * @dev Series for a given NFT.
   * @param _tokenId Id for which we want series.
   * @return Series of _tokenId.
   */
  function tokenSeries(uint256 _tokenId)
    external
    view
    validNFToken(_tokenId)
    returns (uint8)
  {
    return uint8((_tokenId >> 16) & ((1 << 8) - 1));
  }

  /**
   * @dev Pressing for a given NFT.
   * @param _tokenId Id for which we want pressing.
   * @return Pressing of _tokenId.
   */
  function tokenPressing(uint256 _tokenId)
    external
    view
    validNFToken(_tokenId)
    returns (uint16)
  {
    return uint16(_tokenId & ((1 << 16) - 1));
  }

  /**
   * @dev Allows the current owner to transfer control of the contract to a newOwner.
   * @param _newOwner The address to transfer ownership to.
   */
  function transferOwnership(address _newOwner) public override onlyOwner {
    // Transfer operator status
    ownerToOperators[address(this)][owner] = false;
    ownerToOperators[address(this)][_newOwner] = true;
    super.transferOwnership(_newOwner);
  }

  // Planned future functionality L1<>L2 sync
  function setCrossChainAddress(
    address _address
  )
    external
    onlyOwner
  {
    crossChainAddress = _address;
  }
}
