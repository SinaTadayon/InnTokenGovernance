/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import type { Provider, TransactionRequest } from "@ethersproject/providers";
import type {
  ERC20Test,
  ERC20TestInterface,
} from "../../../../src/contracts/test/ERC20Test";

const _abi = [
  {
    inputs: [
      {
        internalType: "string",
        name: "name_",
        type: "string",
      },
      {
        internalType: "string",
        name: "symbol_",
        type: "string",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "Approval",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "Transfer",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
    ],
    name: "allowance",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "approve",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "balanceOf",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [
      {
        internalType: "uint8",
        name: "",
        type: "uint8",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "subtractedValue",
        type: "uint256",
      },
    ],
    name: "decreaseAllowance",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "addedValue",
        type: "uint256",
      },
    ],
    name: "increaseAllowance",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "name",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalSupply",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "transfer",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "transferFrom",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
];

const _bytecode =
  "0x60806040523480156200001157600080fd5b50604051620019b2380380620019b283398181016040528101906200003791906200050f565b8181816003908051906020019062000051929190620002c2565b5080600490805190602001906200006a929190620002c2565b505050620000a17fc09a4dd7e1e7e8b53371c540a2c69f21453eba22259242640ec01d1fbcf77f7360001b6200013560201b60201c565b620000d57f468cc86c7af7fe01d959782f9bbd5335d1c0858cc54854473311c74ca2ca24c160001b6200013560201b60201c565b620001097fb98715754c790ca08154d37d95b503401634a5b0dae94896c06dc0c6fa44210760001b6200013560201b60201c565b6200012d6200011d6200013860201b60201c565b620186a06200014060201b60201c565b50506200073f565b50565b600033905090565b600073ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff1603620001b2576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401620001a990620005f5565b60405180910390fd5b620001c660008383620002b860201b60201c565b8060026000828254620001da919062000650565b92505081905550806000808473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020600082825462000231919062000650565b925050819055508173ffffffffffffffffffffffffffffffffffffffff16600073ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef83604051620002989190620006be565b60405180910390a3620002b460008383620002bd60201b60201c565b5050565b505050565b505050565b828054620002d0906200070a565b90600052602060002090601f016020900481019282620002f4576000855562000340565b82601f106200030f57805160ff191683800117855562000340565b8280016001018555821562000340579182015b828111156200033f57825182559160200191906001019062000322565b5b5090506200034f919062000353565b5090565b5b808211156200036e57600081600090555060010162000354565b5090565b6000604051905090565b600080fd5b600080fd5b600080fd5b600080fd5b6000601f19601f8301169050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b620003db8262000390565b810181811067ffffffffffffffff82111715620003fd57620003fc620003a1565b5b80604052505050565b60006200041262000372565b9050620004208282620003d0565b919050565b600067ffffffffffffffff821115620004435762000442620003a1565b5b6200044e8262000390565b9050602081019050919050565b60005b838110156200047b5780820151818401526020810190506200045e565b838111156200048b576000848401525b50505050565b6000620004a8620004a28462000425565b62000406565b905082815260208101848484011115620004c757620004c66200038b565b5b620004d48482856200045b565b509392505050565b600082601f830112620004f457620004f362000386565b5b81516200050684826020860162000491565b91505092915050565b600080604083850312156200052957620005286200037c565b5b600083015167ffffffffffffffff8111156200054a576200054962000381565b5b6200055885828601620004dc565b925050602083015167ffffffffffffffff8111156200057c576200057b62000381565b5b6200058a85828601620004dc565b9150509250929050565b600082825260208201905092915050565b7f45524332303a206d696e7420746f20746865207a65726f206164647265737300600082015250565b6000620005dd601f8362000594565b9150620005ea82620005a5565b602082019050919050565b600060208201905081810360008301526200061081620005ce565b9050919050565b6000819050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b60006200065d8262000617565b91506200066a8362000617565b9250827fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff03821115620006a257620006a162000621565b5b828201905092915050565b620006b88162000617565b82525050565b6000602082019050620006d56000830184620006ad565b92915050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b600060028204905060018216806200072357607f821691505b602082108103620007395762000738620006db565b5b50919050565b611263806200074f6000396000f3fe608060405234801561001057600080fd5b50600436106100a95760003560e01c80633950935111610071578063395093511461016857806370a082311461019857806395d89b41146101c8578063a457c2d7146101e6578063a9059cbb14610216578063dd62ed3e14610246576100a9565b806306fdde03146100ae578063095ea7b3146100cc57806318160ddd146100fc57806323b872dd1461011a578063313ce5671461014a575b600080fd5b6100b6610276565b6040516100c39190610b1e565b60405180910390f35b6100e660048036038101906100e19190610bd9565b610308565b6040516100f39190610c34565b60405180910390f35b61010461032b565b6040516101119190610c5e565b60405180910390f35b610134600480360381019061012f9190610c79565b610335565b6040516101419190610c34565b60405180910390f35b610152610364565b60405161015f9190610ce8565b60405180910390f35b610182600480360381019061017d9190610bd9565b61036d565b60405161018f9190610c34565b60405180910390f35b6101b260048036038101906101ad9190610d03565b6103a4565b6040516101bf9190610c5e565b60405180910390f35b6101d06103ec565b6040516101dd9190610b1e565b60405180910390f35b61020060048036038101906101fb9190610bd9565b61047e565b60405161020d9190610c34565b60405180910390f35b610230600480360381019061022b9190610bd9565b6104f5565b60405161023d9190610c34565b60405180910390f35b610260600480360381019061025b9190610d30565b610518565b60405161026d9190610c5e565b60405180910390f35b60606003805461028590610d9f565b80601f01602080910402602001604051908101604052809291908181526020018280546102b190610d9f565b80156102fe5780601f106102d3576101008083540402835291602001916102fe565b820191906000526020600020905b8154815290600101906020018083116102e157829003601f168201915b5050505050905090565b60008061031361059f565b90506103208185856105a7565b600191505092915050565b6000600254905090565b60008061034061059f565b905061034d858285610770565b6103588585856107fc565b60019150509392505050565b60006012905090565b60008061037861059f565b905061039981858561038a8589610518565b6103949190610dff565b6105a7565b600191505092915050565b60008060008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020549050919050565b6060600480546103fb90610d9f565b80601f016020809104026020016040519081016040528092919081815260200182805461042790610d9f565b80156104745780601f1061044957610100808354040283529160200191610474565b820191906000526020600020905b81548152906001019060200180831161045757829003601f168201915b5050505050905090565b60008061048961059f565b905060006104978286610518565b9050838110156104dc576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016104d390610ec7565b60405180910390fd5b6104e982868684036105a7565b60019250505092915050565b60008061050061059f565b905061050d8185856107fc565b600191505092915050565b6000600160008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002054905092915050565b600033905090565b600073ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff1603610616576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161060d90610f59565b60405180910390fd5b600073ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff1603610685576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161067c90610feb565b60405180910390fd5b80600160008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020819055508173ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff167f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925836040516107639190610c5e565b60405180910390a3505050565b600061077c8484610518565b90507fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff81146107f657818110156107e8576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016107df90611057565b60405180910390fd5b6107f584848484036105a7565b5b50505050565b600073ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff160361086b576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610862906110e9565b60405180910390fd5b600073ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff16036108da576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016108d19061117b565b60405180910390fd5b6108e5838383610a7b565b60008060008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000205490508181101561096b576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016109629061120d565b60405180910390fd5b8181036000808673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002081905550816000808573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008282546109fe9190610dff565b925050819055508273ffffffffffffffffffffffffffffffffffffffff168473ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef84604051610a629190610c5e565b60405180910390a3610a75848484610a80565b50505050565b505050565b505050565b600081519050919050565b600082825260208201905092915050565b60005b83811015610abf578082015181840152602081019050610aa4565b83811115610ace576000848401525b50505050565b6000601f19601f8301169050919050565b6000610af082610a85565b610afa8185610a90565b9350610b0a818560208601610aa1565b610b1381610ad4565b840191505092915050565b60006020820190508181036000830152610b388184610ae5565b905092915050565b600080fd5b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b6000610b7082610b45565b9050919050565b610b8081610b65565b8114610b8b57600080fd5b50565b600081359050610b9d81610b77565b92915050565b6000819050919050565b610bb681610ba3565b8114610bc157600080fd5b50565b600081359050610bd381610bad565b92915050565b60008060408385031215610bf057610bef610b40565b5b6000610bfe85828601610b8e565b9250506020610c0f85828601610bc4565b9150509250929050565b60008115159050919050565b610c2e81610c19565b82525050565b6000602082019050610c496000830184610c25565b92915050565b610c5881610ba3565b82525050565b6000602082019050610c736000830184610c4f565b92915050565b600080600060608486031215610c9257610c91610b40565b5b6000610ca086828701610b8e565b9350506020610cb186828701610b8e565b9250506040610cc286828701610bc4565b9150509250925092565b600060ff82169050919050565b610ce281610ccc565b82525050565b6000602082019050610cfd6000830184610cd9565b92915050565b600060208284031215610d1957610d18610b40565b5b6000610d2784828501610b8e565b91505092915050565b60008060408385031215610d4757610d46610b40565b5b6000610d5585828601610b8e565b9250506020610d6685828601610b8e565b9150509250929050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b60006002820490506001821680610db757607f821691505b602082108103610dca57610dc9610d70565b5b50919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b6000610e0a82610ba3565b9150610e1583610ba3565b9250827fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff03821115610e4a57610e49610dd0565b5b828201905092915050565b7f45524332303a2064656372656173656420616c6c6f77616e63652062656c6f7760008201527f207a65726f000000000000000000000000000000000000000000000000000000602082015250565b6000610eb1602583610a90565b9150610ebc82610e55565b604082019050919050565b60006020820190508181036000830152610ee081610ea4565b9050919050565b7f45524332303a20617070726f76652066726f6d20746865207a65726f2061646460008201527f7265737300000000000000000000000000000000000000000000000000000000602082015250565b6000610f43602483610a90565b9150610f4e82610ee7565b604082019050919050565b60006020820190508181036000830152610f7281610f36565b9050919050565b7f45524332303a20617070726f766520746f20746865207a65726f20616464726560008201527f7373000000000000000000000000000000000000000000000000000000000000602082015250565b6000610fd5602283610a90565b9150610fe082610f79565b604082019050919050565b6000602082019050818103600083015261100481610fc8565b9050919050565b7f45524332303a20696e73756666696369656e7420616c6c6f77616e6365000000600082015250565b6000611041601d83610a90565b915061104c8261100b565b602082019050919050565b6000602082019050818103600083015261107081611034565b9050919050565b7f45524332303a207472616e736665722066726f6d20746865207a65726f20616460008201527f6472657373000000000000000000000000000000000000000000000000000000602082015250565b60006110d3602583610a90565b91506110de82611077565b604082019050919050565b60006020820190508181036000830152611102816110c6565b9050919050565b7f45524332303a207472616e7366657220746f20746865207a65726f206164647260008201527f6573730000000000000000000000000000000000000000000000000000000000602082015250565b6000611165602383610a90565b915061117082611109565b604082019050919050565b6000602082019050818103600083015261119481611158565b9050919050565b7f45524332303a207472616e7366657220616d6f756e742065786365656473206260008201527f616c616e63650000000000000000000000000000000000000000000000000000602082015250565b60006111f7602683610a90565b91506112028261119b565b604082019050919050565b60006020820190508181036000830152611226816111ea565b905091905056fea264697066735822122060dfd549676c2bb70572a2a83707874b91d97f9ef985361b928a23557ef72f7964736f6c634300080e0033";

type ERC20TestConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: ERC20TestConstructorParams
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class ERC20Test__factory extends ContractFactory {
  constructor(...args: ERC20TestConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      super(_abi, _bytecode, args[0]);
    }
  }

  override deploy(
    name_: string,
    symbol_: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ERC20Test> {
    return super.deploy(name_, symbol_, overrides || {}) as Promise<ERC20Test>;
  }
  override getDeployTransaction(
    name_: string,
    symbol_: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(name_, symbol_, overrides || {});
  }
  override attach(address: string): ERC20Test {
    return super.attach(address) as ERC20Test;
  }
  override connect(signer: Signer): ERC20Test__factory {
    return super.connect(signer) as ERC20Test__factory;
  }

  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): ERC20TestInterface {
    return new utils.Interface(_abi) as ERC20TestInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): ERC20Test {
    return new Contract(address, _abi, signerOrProvider) as ERC20Test;
  }
}
