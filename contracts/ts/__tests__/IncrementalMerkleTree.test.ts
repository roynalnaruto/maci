require('module-alias/register')
jest.setTimeout(60000)
import { genAccounts, genTestAccounts } from '../accounts'
import { config } from 'maci-config'
import {
    genRandomSalt,
    hashOne,
    SnarkBigInt,
    NOTHING_UP_MY_SLEEVE,
    IncrementalMerkleTree,
} from 'maci-crypto'

import * as etherlime from 'etherlime-lib'
const MiMC = require('@maci-contracts/compiled/MiMC.json')
const IncrementalMerkleTreeAbi = require('@maci-contracts/compiled/IncrementalMerkleTree.json')

const accounts = genTestAccounts(1)
let deployer
let mtContract
let mimcContract

const DEPTH = 4

let tree
describe('IncrementalMerkleTree', () => {
    beforeAll(async () => {
        deployer = new etherlime.JSONRPCPrivateKeyDeployer(
            accounts[0].privateKey,
            config.get('chain.url'),
            {
                gasLimit: 8800000,
            },
        )

        console.log('Deploying MiMC')
        mimcContract = await deployer.deploy(MiMC, {})

        console.log('Deploying IncrementalMerkleTree')
        mtContract = await deployer.deploy(
            IncrementalMerkleTreeAbi,
            { MiMC: mimcContract.contractAddress },
            DEPTH,
            NOTHING_UP_MY_SLEEVE.toString(),
        )

        tree = new IncrementalMerkleTree(DEPTH, NOTHING_UP_MY_SLEEVE)
    })

    it('an empty tree should have the correct root', async () => {
        const root1 = await mtContract.root()
        expect(tree.root.toString()).toEqual(root1.toString())
    })

    it('the on-chain root should match an off-chain root after various insertions', async () => {
        expect.assertions(6)
        for (let i=0; i < 6; i++) {
            const leaf = genRandomSalt()

            const tx = await mtContract.insertLeaf(leaf.toString())
            await tx.wait()
            const root1 = await mtContract.root()

            tree.insert(leaf)

            expect(tree.root.toString()).toEqual(root1.toString())
        }
    })
})
