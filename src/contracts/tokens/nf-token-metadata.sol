// SPDX-License-Identifier: MIT
pragma solidity 0.8.0;

import "./nf-token.sol";
import "./erc721-metadata.sol";
import "../ownership/ownable.sol";

/**
 * @dev Optional metadata implementation for ERC-721 non-fungible token standard.
 */
contract NFTokenMetadata is
  Ownable,
  NFToken,
  ERC721Metadata
{

  struct TokenMetadata {
    string memo;
    string uri;
  }

  /**
   * @dev A descriptive name for a collection of NFTs.
   */
  string internal nftName;

  /**
   * @dev An abbreviated name for NFTokens.
   */
  string internal nftSymbol;

  /**
   * @dev Base URI for token.
   */
  string internal baseUri;

  /**
   * @dev Mapping from NFT ID to metadata.
   */
  mapping (uint256 => TokenMetadata) idToData;

  /**
   * @dev Contract constructor.
   * @notice When implementing this contract don't forget to set nftName and nftSymbol.
   */
  constructor()
  {
    supportedInterfaces[0x5b5e139f] = true; // ERC721Metadata
  }

  function setBaseUri(
    string calldata _baseUri
  )
    external
    onlyOwner
  {
    baseUri = _baseUri;
  }

  /**
   * @dev Returns a descriptive name for a collection of NFTokens.
   * @return _name Representing name.
   */
  function name()
    external
    override
    view
    returns (string memory _name)
  {
    _name = nftName;
  }

  /**
   * @dev Returns an abbreviated name for NFTokens.
   * @return _symbol Representing symbol.
   */
  function symbol()
    external
    override
    view
    returns (string memory _symbol)
  {
    _symbol = nftSymbol;
  }

  function append(string memory a, string memory b) internal pure returns (string memory) {
    return string(abi.encodePacked(a, b));
  }

  /**
   * @dev A distinct URI (RFC 3986) for a given NFT.
   * @param _tokenId Id for which we want uri.
   * @return URI of _tokenId.
   */
  function tokenURI(
    uint256 _tokenId
  )
    external
    override
    view
    validNFToken(_tokenId)
    returns (string memory)
  {
    return append(baseUri, idToData[_tokenId].uri);
  }

  /**
   * @dev A memo for a given NFT.
   * @param _tokenId Id for which we want memo.
   * @return memo of _tokenId.
   */
  function tokenMemo(
    uint256 _tokenId
  )
    external
    view
    validNFToken(_tokenId)
    returns (string memory)
  {
    return idToData[_tokenId].memo;
  }

  /**
   * @param _tokenId Id for which we want data.
   * @return data of _tokenId.
   */
  function tokenData(
    uint256 _tokenId
  )
    external
    view
    validNFToken(_tokenId)
    returns (TokenMetadata memory)
  {
    return idToData[_tokenId];
  }

  function _setTokenData(
    uint256 _tokenId,
    TokenMetadata memory _data
  )
    internal
    validNFToken(_tokenId)
  {
    idToData[_tokenId] = _data;
  }

  function _setTokenUri(
    uint256 _tokenId,
    string memory _uri
  )
    internal
    validNFToken(_tokenId)
  {
    idToData[_tokenId].uri = _uri;
  }
}
