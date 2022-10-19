import { expect } from "chai"
import { ethers, getNamedAccounts, network } from "hardhat"
import { developmentChains } from "../../helper-hardhat-config"
import { FundMe } from "./../../typechain-types/contracts/FundMe"

developmentChains.includes(network.name)
  ? describe.skip
  : describe("FundMe", () => {
      let fundMe: FundMe
      let deployer: string
      const ONE_ETH = ethers.utils.parseEther("0.1")

      beforeEach(async () => {
        deployer = (await getNamedAccounts()).deployer
        fundMe = await ethers.getContract("FundMe", deployer)
      })

      it("allows people to fund and withdraw", async () => {
        const fundTxResponse = await fundMe.fund({ value: ONE_ETH })
        fundTxResponse.wait(1)
        const withdrawTxResponse = await fundMe.withdraw()
        withdrawTxResponse.wait(1)

        const endingBalance = await ethers.provider.getBalance(fundMe.address)
        console.log("endingBalance", endingBalance)

        expect(endingBalance).to.equal(0)
      })
    })
