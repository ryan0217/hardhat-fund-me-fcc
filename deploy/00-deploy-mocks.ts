import { network } from "hardhat"
import { HardhatRuntimeEnvironment } from "hardhat/types"
import {
  DECIMALS,
  developmentChains,
  INITIAL_ANSWER,
} from "../helper-hardhat-config"

const deployMocks = async ({
  getNamedAccounts,
  deployments,
}: HardhatRuntimeEnvironment) => {
  const { deploy, log } = deployments
  const { deployer } = await getNamedAccounts()
  console.log("deployer", deployer)

  if (developmentChains.includes(network.name)) {
    log("Local network detected! Deploying mocks...")
    await deploy("MockV3Aggregator", {
      from: deployer,
      contract: "MockV3Aggregator",
      log: true,
      args: [DECIMALS, INITIAL_ANSWER],
    })
    log("Mocks deployed!")
    log("-----------------------------------------------------------------")
  }
}

deployMocks.tags = ["All", "Mocks"]

export default deployMocks
