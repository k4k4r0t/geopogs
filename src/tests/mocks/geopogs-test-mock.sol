// SPDX-License-Identifier: MIT
pragma solidity 0.8.0;

import "../../contracts/geopogs.sol";

contract GeoPogsTestMock is
  GeoPogs
{

  constructor(
    string memory _name,
    string memory _symbol,
    string memory _baseUri
  )
    GeoPogs(_name, _symbol, _baseUri)
  {
  }

  function checkUri(
    uint256 _tokenId
  )
    external
    view
    returns (string memory)
  {
    return idToData[_tokenId].uri;
  }

}
