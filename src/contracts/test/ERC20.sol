// SPDX-License-Identifier: MIT
pragma solidity 0.8.14;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "hardhat/console.sol";

contract InnToken is ERC20, ERC20Burnable, AccessControl {
    bytes32 public constant CONSENSUS_ROLE = keccak256("CONSENSUS_ROLE");
 
    address public COMMISSION_WALLET_ADDRESS;
    address public RESERVES_WALLET_ADDRESS;

    mapping(address => bytes32) internal _wallets;
    mapping (address => bool) private frozenAccount;
 
    event FrozenFunds(address indexed target, bool frozen);

    constructor(address RESERVE , address COMMISSION ) ERC20("InnToken", "INN") {

        COMMISSION_WALLET_ADDRESS = COMMISSION ; 
        RESERVES_WALLET_ADDRESS = RESERVE; 

        _wallets[COMMISSION_WALLET_ADDRESS] = keccak256("COMMISSION_WALLET");
        _wallets[RESERVES_WALLET_ADDRESS] = keccak256("RESERVES_WALLET");

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(CONSENSUS_ROLE, msg.sender);

        //the `DEFAULT_ADMIN_ROLE` is the admin of himself and `CONSENSUS_ROLE`
        _setRoleAdmin(DEFAULT_ADMIN_ROLE ,DEFAULT_ADMIN_ROLE );
        _setRoleAdmin(CONSENSUS_ROLE ,DEFAULT_ADMIN_ROLE );

        mint(RESERVES_WALLET_ADDRESS , 2_000_000_000 * 10**7);
    }
    
    function decimals() public pure override returns (uint8) {
        return 7;
    }
    function mint(address to, uint256 amount) public onlyRole(DEFAULT_ADMIN_ROLE) {
        _mint(to, amount);
    }
    
    /**
     * this hook used in burn or burn from that depends on CONSENSUE_ROLE . 
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override(ERC20) {
        if(from == RESERVES_WALLET_ADDRESS) {
            // console.log("sender: %s,", msg.sender);
            // console.log("from: %s, to: %s, amount: %s", from, to, amount);
            require(hasRole(CONSENSUS_ROLE, msg.sender) , "INNTOKEN : only CONSENSUS_ROLE can transfer from RESERVES_WALLET_ADDRESS ");
        }
        else if (from == COMMISSION_WALLET_ADDRESS)
            require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender));
            
        require(!frozenAccount[msg.sender], "INNToken : already account freezed");    
        super._beforeTokenTransfer(from , to , amount);
    }

//     function transferFrom(
//         address from,
//         address to,
//         uint256 amount
//     ) public virtual override returns (bool) {
//         address spender = _msgSender();
//         console.log("transferFrom, from: %s, to: %s, sender: %s", from, to, _msgSender());
//         _spendAllowance(from, spender, amount);
//         console.log("_spendAllowance is success");
//         _transfer(from, to, amount);
//         return true;
//     }
  
//   function _spendAllowance(
//         address owner,
//         address spender,
//         uint256 amount
//     ) internal virtual override {
//         uint256 currentAllowance = allowance(owner, spender);
//         if (currentAllowance != type(uint256).max) {
//             console.log("currentAllowance: %sd, amount: %s", currentAllowance, amount);
//             require(currentAllowance >= amount, "ERC20: insufficient allowance");
//             unchecked {
//                 _approve(owner, spender, currentAllowance - amount);
//             }
//         }
//     }

  function freezeAccount(address target) public onlyRole(DEFAULT_ADMIN_ROLE) {
        require(balanceOf(target) > 0, "INNTOKEN : account must has a balance");
        frozenAccount[target] = true;
        emit FrozenFunds(target, true);
  }
  
  function unFreezeAccount(address target) public onlyRole(DEFAULT_ADMIN_ROLE) {
        require(freezeOf(target), "INNTOKEN : account must be freezed");
        frozenAccount[target] = false;
        emit FrozenFunds(target, false);
  }  

  function freezeOf(address target) public view returns (bool) {
      return frozenAccount[target];
  }

  function destroy() onlyRole(DEFAULT_ADMIN_ROLE) public {
    selfdestruct(payable(msg.sender));
  }

  function destroyAndSend(address _recipient)  onlyRole(DEFAULT_ADMIN_ROLE) public {
    selfdestruct(payable(_recipient));
  }
}
