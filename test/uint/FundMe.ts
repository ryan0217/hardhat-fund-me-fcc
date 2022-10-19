import { developmentChains } from "./../../helper-hardhat-config"
import { expect } from "chai"
import { deployments, ethers, getNamedAccounts, network } from "hardhat"
import { FundMe } from "../../typechain-types"
import { MockV3Aggregator } from "./../../typechain-types/@chainlink/contracts/src/v0.8/tests/MockV3Aggregator"

!developmentChains.includes(network.name)
  ? describe.skip
  : describe("FundMe", async () => {
      let fundMe: FundMe
      let deployer: string
      let mockV3Aggregator: MockV3Aggregator
      const ONE_ETHER = ethers.utils.parseEther("1")

      beforeEach(async () => {
        // deploy our fundMe contract
        // Using Hardhat-deploy
        // const accounts = await ethers.getSigners()
        // const accountZero = accounts[0]
        deployer = (await getNamedAccounts()).deployer
        await deployments.fixture(["All"])
        fundMe = await ethers.getContract("FundMe", deployer)
        mockV3Aggregator = await ethers.getContract(
          "MockV3Aggregator",
          deployer
        )
      })

      describe("constructor", async () => {
        it("Sets the aggregator address correctly", async () => {
          const response = await fundMe.getPriceFeed()
          expect(response).to.equal(mockV3Aggregator.address)
        })
      })

      describe("fund", async () => {
        it("Fails if you don't send enough ETH", async () => {
          await expect(fundMe.fund()).to.be.revertedWith(
            "You need to spend more ETH!"
          )
        })

        it("updated the amount funded data structure", async () => {
          await fundMe.fund({ value: ONE_ETHER })
          const balance = await fundMe.getAddressToAmountFunded(deployer)
          expect(balance).to.equal(ONE_ETHER)
        })

        it("Adds funder to array of funders", async () => {
          await fundMe.fund({ value: ONE_ETHER })
          const funder = await fundMe.s_funders(0)
          expect(funder).to.equal(deployer)
        })
      })

      describe("withdraw", async () => {
        beforeEach(async () => {
          await fundMe.fund({ value: ONE_ETHER })
        })

        it("withdraw ETH from a single founder", async () => {
          // Arrange
          const startingFundMeBalance = await ethers.provider.getBalance(
            fundMe.address
          )
          const startingDeployerBalance = await ethers.provider.getBalance(
            deployer
          )

          // Act
          const transactionResponse = await fundMe.withdraw()
          const transactionReceipt = await transactionResponse.wait(1)
          const { gasUsed, effectiveGasPrice } = transactionReceipt
          const gasCost = gasUsed.mul(effectiveGasPrice)

          const endingFundMeBalance = await ethers.provider.getBalance(
            fundMe.address
          )
          const endingDeployerBalance = await ethers.provider.getBalance(
            deployer
          )

          // Assert
          expect(endingFundMeBalance).to.equal(0)
          expect(startingFundMeBalance.add(startingDeployerBalance)).to.equal(
            endingDeployerBalance.add(gasCost)
          )
        })

        it("allows us to withdraw with multiple funders", async () => {
          const accounts = await ethers.getSigners()

          for (let i = 1; i < 6; i++) {
            const fundMeConnectedContract = await fundMe.connect(accounts[i])
            await fundMeConnectedContract.fund({ value: ONE_ETHER })
          }

          // Arrange
          const startingFundMeBalance = await ethers.provider.getBalance(
            fundMe.address
          )
          const startingDeployerBalance = await ethers.provider.getBalance(
            deployer
          )

          // Act
          const transactionResponse = await fundMe.withdraw()
          const transactionReceipt = await transactionResponse.wait(1)
          const { gasUsed, effectiveGasPrice } = transactionReceipt
          const gasCost = gasUsed.mul(effectiveGasPrice)

          const endingFundMeBalance = await ethers.provider.getBalance(
            fundMe.address
          )
          const endingDeployerBalance = await ethers.provider.getBalance(
            deployer
          )

          // Assert
          expect(endingFundMeBalance).to.equal(0)
          expect(startingFundMeBalance.add(startingDeployerBalance)).to.equal(
            endingDeployerBalance.add(gasCost)
          )

          // Make sure that the funders are reset properly
          await expect(fundMe.s_funders(0)).to.be.reverted

          for (let i = 0; i < 6; i++) {
            const curAccountFunded = await fundMe.getAddressToAmountFunded(
              accounts[i].address
            )
            expect(curAccountFunded).to.equal(0)
          }
        })

        it("allows us to cheaper withdraw with multiple funders", async () => {
          const accounts = await ethers.getSigners()

          for (let i = 1; i < 6; i++) {
            const fundMeConnectedContract = await fundMe.connect(accounts[i])
            await fundMeConnectedContract.fund({ value: ONE_ETHER })
          }

          // Arrange
          const startingFundMeBalance = await ethers.provider.getBalance(
            fundMe.address
          )
          const startingDeployerBalance = await ethers.provider.getBalance(
            deployer
          )

          // Act
          const transactionResponse = await fundMe.cheaperWithdraw()
          const transactionReceipt = await transactionResponse.wait(1)
          const { gasUsed, effectiveGasPrice } = transactionReceipt
          const gasCost = gasUsed.mul(effectiveGasPrice)

          const endingFundMeBalance = await ethers.provider.getBalance(
            fundMe.address
          )
          const endingDeployerBalance = await ethers.provider.getBalance(
            deployer
          )

          // Assert
          expect(endingFundMeBalance).to.equal(0)
          expect(startingFundMeBalance.add(startingDeployerBalance)).to.equal(
            endingDeployerBalance.add(gasCost)
          )

          // Make sure that the funders are reset properly
          await expect(fundMe.s_funders(0)).to.be.reverted

          for (let i = 0; i < 6; i++) {
            const curAccountFunded = await fundMe.getAddressToAmountFunded(
              accounts[i].address
            )
            expect(curAccountFunded).to.equal(0)
          }
        })

        it("only allows the owner to withdraw", async () => {
          const accounts = await ethers.getSigners()
          const attacker = accounts[1]
          const attackerConnectedContract = await fundMe.connect(attacker)
          await expect(attackerConnectedContract.withdraw()).to.be.reverted
        })
      })
    })
