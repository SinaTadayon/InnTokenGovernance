// SPDX-License-Identifier: MIT
pragma solidity 0.8.14;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "./Wallet.sol";

contract InnToken is ERC20, ERC20Burnable, AccessControl, Wallet {
    bytes32 public constant CONSENSUS_ROLE = keccak256("CONSENSUS_ROLE");
    mapping(address => bool) private frozenAccount;

    event FrozenFunds(address indexed target, bool frozen);

    constructor(address RESEVERD, address COMMISION)
        ERC20("InnToken", "INT")
        Wallet(RESEVERD, COMMISION)
    {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(CONSENSUS_ROLE, msg.sender);

        //the `DEFAULT_ADMIN_ROLE` is the admin of himself and `CONSENSUS_ROLE`
        _setRoleAdmin(DEFAULT_ADMIN_ROLE, DEFAULT_ADMIN_ROLE);
        _setRoleAdmin(CONSENSUS_ROLE, DEFAULT_ADMIN_ROLE);

        _firstInitializeWallet();
    }

    function decimals() public pure override returns (uint8) {
        return 7;
    }

    function mint(address to, uint256 amount)
        public
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
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
        if (from == RESERVES_WALLET_ADDRESS)
            require(
                hasRole(CONSENSUS_ROLE, msg.sender),
                "INNTOKEN : only CONSENSUS_ROLE can transfer from RESERVES_WALLET_ADDRESS "
            );
        else if (from == COMMISSION_WALLET_ADDRESS)
            require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender));
        require(
            !frozenAccount[msg.sender],
            "INNToken : already account freezed"
        );

        super._beforeTokenTransfer(from, to, amount);
    }

    function freezeAccount(address target) public onlyRole(DEFAULT_ADMIN_ROLE) {
        require(balanceOf(target) > 0, "INNTOKEN : account must has a balance");
        frozenAccount[target] = true;
        emit FrozenFunds(target, true);
    }

    function unFreezeAccount(address target)
        public
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        require(freezeOf(target), "INNTOKEN : account must be freezed");
        frozenAccount[target] = false;
        emit FrozenFunds(target, false);
    }

    function freezeOf(address target) public view returns (bool) {
        return frozenAccount[target];
    }

    function destroy() public onlyRole(DEFAULT_ADMIN_ROLE) {
        selfdestruct(payable(msg.sender));
    }

    function destroyAndSend(address _recipient)
        public
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        selfdestruct(payable(_recipient));
    }

    function _firstInitializeWallet() private onlyRole(DEFAULT_ADMIN_ROLE) {
        mint(RESERVES_WALLET_ADDRESS, 1_996_760_000 * 10**7);
        mint(address(COMMISSION_WALLET_ADDRESS), 77508 * 10**7);
        mint(address(0x03a64C4DCe2868079bBB1AdE47E13495ED1e1111), 1000 * 10**7);
        mint(address(0x044815973DC7796357762C87A5dc5e737f4e363A), 1000 * 10**7);
        mint(address(0x09C5819883cA0b507e3De585b9d17346726839c6), 1000 * 10**7);
        mint(address(0x0Ca2e38E27D299230AF6290c62065C2125FFDE99), 1 * 10**7);
        mint(address(0x0D2399cE58eeEf280B15044da6237e151904ab89), 1500 * 10**7);
        mint(address(0x1856f606Dd40692Ac455726246c1f5afb71a4901), 1000 * 10**7);
        mint(address(0x1F82A9618741eEe8958e081f261e369B48F18e39), 600 * 10**7);
        mint(address(0x23438EeCb18f6dFbB8bDDa399c28a2ec33783CC5), 1000 * 10**7);
        mint(
            address(0x2d60f692E17Cf5d0B68C131A0D4f0fFa50D5B9EB),
            10619.3 * 10**7
        );
        mint(address(0x31705e75F871F5DA10533a08B68576af3D120c05), 1000 * 10**7);
        mint(address(0x35C34408C112daC0F25900B7aAe99a9425891B1b), 1400 * 10**7);
        mint(address(0x411aAb879f792B261B0B2655d5d93012c1551b12), 1400 * 10**7);
        mint(address(0x4120C5732Ac11343b819EFdEfa51051a61CA2615), 1000 * 10**7);
        mint(
            address(0x51BDE05b0fd2d3980E3D859DCC3E285F114Faf68),
            20000 * 10**7
        );
        mint(address(0x43fb84E0F32eF94C59B44fEa91C76547A7A3eb90), 1000 * 10**7);
        mint(address(0x4FbAb20644eEd869DdA9258b6F3f5437275b1d65), 1000 * 10**7);
        mint(address(0x51BDE05b0fd2d3980E3D859DCC3E285F114Faf68), 500 * 10**7);
        mint(address(0x51CeB6F845bAdC88E0E13A33AaEaE46dc7bccE73), 1000 * 10**7);
        mint(address(0x555F2d31d931854186049577F9240783Be1abeeB), 250 * 10**7);
        mint(address(0x5894d1784838C62979b6403AD0d5A273AdDb0c6D), 1000 * 10**7);
        mint(address(0x58fF07F14BC6Bb643Fc138d92f580f586Cba6672), 250 * 10**7);
        mint(
            address(0x5fEd6D7c6d4b78bC94c531aacf10e32572d30522),
            7337.7 * 10**7
        );
        mint(address(0x61dc996cB036253E80Dfbad887FEDf924F244D4f), 1000 * 10**7);
        mint(address(0x634c6B7b3C8E0fC4d5c748aeB8B5Ec48571aF753), 1501 * 10**7);
        mint(address(0x671b18886Aabdbf5dB5ec71A60352C94AFc3b3e0), 400 * 10**7);
        mint(address(0x6d83f9065326d04b544d7c850506402a313e4863), 500 * 10**7);
        mint(address(0x6fBD939c01CA47D1Bc475422657B44589516694F), 1400 * 10**7);
        mint(address(0x7178e85cE66fadE2eD97bcB81B4e955A4ec86eFb), 1400 * 10**7);
        mint(address(0x745609b8E60A9CABA8CD081d036D710cCe8889fb), 1000 * 10**7);
        mint(address(0x768014fd191928D94ec6fb886EbC4eCc06388Fa4), 2000 * 10**7);
        mint(address(0x7CCDa7a010d0f2e40AABe82863c1f55fe1246cE4), 1000 * 10**7);
        mint(address(0x8B818656C935547656e88D175d4896214E227956), 1000 * 10**7);
        mint(address(0x90f21641fd1Dd90AdEaed9548eCF8E4c008F7719), 250 * 10**7);
        mint(address(0x992B5498AB44b0D978C734De2842f8e240dc3363), 1400 * 10**7);
        mint(address(0xa192B349FB7559096EDd897Ce69152fFFE2601ba), 2000 * 10**7);
        mint(address(0xa2Dbda7999574BBfB3CF5cdBD8a167e951091b51), 1000 * 10**7);
        mint(
            address(0xa68d544CEa02D5f78C8B4ca2B9C962510ec44a49),
            2948990 * 10**7
        );
        mint(address(0xa7D31c7854f5335121b784cd4bb6675b37E649Fe), 1368 * 10**7);
        mint(address(0xA8C22ed8e39b4d959C808b980f47d8ba3ef3A5Eb), 1400 * 10**7);
        mint(address(0xaE39104466824555DD079b6Be2dAE559Da834E4F), 1000 * 10**7);
        mint(address(0xb04D09d8d6a1d421E72c5691d969F95a77FC25c7), 1400 * 10**7);
        mint(address(0xB38056be1AE9e5e2DC70cEaBd4d1EEeCa616Cb46), 1000 * 10**7);
        mint(address(0xb493151eE82625E8512aE1e4bBf1A4f08d431187), 1000 * 10**7);
        mint(address(0xBDbc002fd24080381efDFB53467Bab1Ecd66129B), 250 * 10**7);
        mint(
            address(0xD2b3501E9D11a05CCD0d72F4a633F8Fd44E49b37),
            88490 * 10**7
        );
        mint(address(0xDeAd9D5E9CDE6c9173B2719Fd1F5a551E62ddB43), 1000 * 10**7);
        mint(address(0xeeD789F989233A88C0234202e0a1807E8a422218), 1000 * 10**7);
        mint(address(0xF390e83B18820bC5b1b03604d5e543232db7b591), 2402 * 10**7);
        mint(address(0xf3Cf9744EA50A6f2889358e3C1a2A45Bf2324611), 1000 * 10**7);
        mint(address(0xF4d66bCDB36113D8B5772f9401C375A73E3c20d1), 974 * 10**7);
        mint(address(0xf56eFEc91B5741713C55269fB45FAC12bf201897), 9 * 10**7);
        mint(address(0xFe765dBb4f56BDc239d1E3Dd500A9Fef8A5B7246), 500 * 10**7);

        mint(
            address(0xaB9f782067f143E358382d7a4EE12517219363FB),
            20000 * 10**7
        );
        mint(
            address(0x5ff9e95946663d2f27833fbF98E96f33C69876DF),
            20000 * 10**7
        );
    }
}
