-include .env

.PHONY: build test deploy deploy-dry-run

build:
	forge build

test:
	forge test -vvv

deploy-dry-run:
	forge script script/Deploy.s.sol:DeployScript --rpc-url xlayer -vvv

deploy:
	forge script script/Deploy.s.sol:DeployScript --rpc-url xlayer --broadcast --verify -vvv
