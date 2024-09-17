# Changelog

All notable changes to this project will be documented in this file. See [commit-and-tag-version](https://github.com/absolute-version/commit-and-tag-version) for commit guidelines.

## [2.0.0-0](https://github.com/jdpnielsen/contextual-error/compare/v1.2.3...v2.0.0-0) (2024-09-17)


### ⚠ BREAKING CHANGES

* CError's static .cause() method was changed to .getCause(). Constructor
arguments were consolidated, so there are now two optional arguments
instead.
* Target ES version is now ES2022

### deps

* update typescript to v5 & node to v22 ([3dc28bc](https://github.com/jdpnielsen/contextual-error/commit/3dc28bc05438d4c63fb5e17b2dd698e45b6ebfdf))


### Features

* Reuse native javascript cause property ([67575a8](https://github.com/jdpnielsen/contextual-error/commit/67575a87ab7ff3d7470b2dff925800323bc24982))

### [1.2.3](https://github.com/jdpnielsen/contextual-error/compare/v1.2.2...v1.2.3) (2021-05-27)


### Bug Fixes

* remove build script for browser version ([218fd3c](https://github.com/jdpnielsen/contextual-error/commit/218fd3cb01d2d0290ed435d937cf5b6a4f94e369))

### [1.2.2](https://github.com/jdpnielsen/contextual-error/compare/v1.2.1...v1.2.2) (2021-05-27)

### [1.2.1](https://github.com/jdpnielsen/contextual-error/compare/v1.2.0...v1.2.1) (2021-05-07)

## [1.2.0](https://github.com/jdpnielsen/contextual-error/compare/v1.1.0...v1.2.0) (2020-09-22)


### Features

* enhance isCError & isWError methods with type predicate ([8a4037d](https://github.com/jdpnielsen/contextual-error/commit/8a4037d37bbe8e115e9b47ce24cfc085da3fdd63))

## [1.1.0](https://github.com/jdpnielsen/contextual-error/compare/v1.0.5...v1.1.0) (2020-09-22)


### Features

* implement isCError & isWError methods ([62b52ea](https://github.com/jdpnielsen/contextual-error/commit/62b52eafac19fcc397d8e623ad0e1ca2cb99cf33))

### [1.0.5](https://github.com/jdpnielsen/contextual-error/compare/v1.0.4...v1.0.5) (2020-09-14)


### Bug Fixes

* make cause a nonenumerable property ([74ae474](https://github.com/jdpnielsen/contextual-error/commit/74ae4746d96c48b0ad6db89bc3f696880f78bd3e))
* remove reliance on instanceof & use duck-typing instead ([a37badf](https://github.com/jdpnielsen/contextual-error/commit/a37badffbaaa4c0438e43c5dbd3e651492ea3d3d))

### [1.0.4](https://github.com/jdpnielsen/contextual-error/compare/v1.0.3...v1.0.4) (2020-08-11)

### [1.0.3](https://github.com/jdpnielsen/contextual-error/compare/v1.0.2...v1.0.3) (2020-08-11)

### [1.0.2](https://github.com/jdpnielsen/contextual-error/compare/v1.0.1...v1.0.2) (2020-08-11)

### [1.0.1](https://github.com/jdpnielsen/contextual-error/compare/v1.0.0...v1.0.1) (2020-08-11)

## 1.0.0 (2020-08-11)
