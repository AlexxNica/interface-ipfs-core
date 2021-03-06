/* eslint-env mocha */
/* eslint max-nested-callbacks: ["error", 8] */

'use strict'

const expect = require('chai').expect
const series = require('async/series')
const pull = require('pull-stream')
const dagPB = require('ipld-dag-pb')
const DAGNode = dagPB.DAGNode
const dagCBOR = require('ipld-dag-cbor')

module.exports = (common) => {
  describe('.dag', () => {
    let ipfs

    before(function (done) {
      // CI is slow
      this.timeout(20 * 1000)

      common.setup((err, factory) => {
        expect(err).to.not.exist
        factory.spawnNode((err, node) => {
          expect(err).to.not.exist
          ipfs = node
          done()
        })
      })
    })

    after((done) => {
      common.teardown(done)
    })

    describe('callback API', () => {
      let pbNode
      let cborNode

      before((done) => {
        const someData = new Buffer('some data')

        pbNode = DAGNode.create(someData, (err, node) => {
          expect(err).to.not.exist
          pbNode = node
          done()
        })

        cborNode = {
          data: someData
        }
      })

      describe('.put', () => {
        it('dag-pb with default hash func (sha2-256)', (done) => {
          ipfs.dag.put(pbNode, {
            format: 'dag-pb',
            hashAlg: 'sha2-256'
          }, done)
        })

        it('dag-pb with custom hash func (sha3-512)', (done) => {
          ipfs.dag.put(pbNode, {
            format: 'dag-pb',
            hashAlg: 'sha3-512'
          }, done)
        })

        /*
         * This works because dag-cbor will just treat pbNode as a regular object
        it.skip('dag-pb node with wrong multicodec', (done) => {
          // This works because dag-cbor will just treat pbNode as a
          // regular object
          ipfs.dag.put(pbNode, 'dag-cbor', 'sha3-512', (err) => {
            expect(err).to.exist
            done()
          })
        })
        */

        it('dag-cbor with default hash func (sha2-256)', (done) => {
          ipfs.dag.put(cborNode, {
            format: 'dag-cbor',
            hashAlg: 'sha2-256'
          }, done)
        })

        it('dag-cbor with custom hash func (sha3-512)', (done) => {
          ipfs.dag.put(cborNode, {
            format: 'dag-cbor',
            hashAlg: 'sha3-512'
          }, done)
        })

        it('dag-cbor node with wrong multicodec', (done) => {
          ipfs.dag.put(cborNode, {
            format: 'dag-pb',
            hashAlg: 'sha3-512'
          }, (err) => {
            expect(err).to.exist
            done()
          })
        })
      })

      describe('.get', () => {
        let pbNode
        let cborNode

        let nodePb
        let nodeCbor
        let cidPb
        let cidCbor

        before((done) => {
          series([
            (cb) => {
              const someData = new Buffer('some other data')

              pbNode = DAGNode.create(someData, (err, node) => {
                expect(err).to.not.exist
                pbNode = node
                cb()
              })

              cborNode = {
                data: someData
              }
            },
            (cb) => {
              dagPB.DAGNode.create(new Buffer('I am inside a Protobuf'), (err, node) => {
                expect(err).to.not.exist
                nodePb = node
                cb()
              })
            },
            (cb) => {
              dagPB.util.cid(nodePb, (err, cid) => {
                expect(err).to.not.exist
                cidPb = cid
                cb()
              })
            },
            (cb) => {
              nodeCbor = {
                someData: 'I am inside a Cbor object',
                pb: { '/': cidPb.toBaseEncodedString() }
              }

              dagCBOR.util.cid(nodeCbor, (err, cid) => {
                expect(err).to.not.exist
                cidCbor = cid
                cb()
              })
            }
          ], store)

          function store () {
            pull(
              pull.values([
                { node: nodePb, multicodec: 'dag-pb', hashAlg: 'sha2-256' },
                { node: nodeCbor, multicodec: 'dag-cbor', hashAlg: 'sha2-256' }
              ]),
              pull.asyncMap((el, cb) => {
                ipfs.dag.put(el.node, {
                  format: el.multicodec,
                  hashAlg: el.hashAlg
                }, cb)
              }),
              pull.onEnd(done)
            )
          }
        })

        it('dag-pb node', (done) => {
          ipfs.dag.put(pbNode, {
            format: 'dag-pb',
            hashAlg: 'sha2-256'
          }, (err) => {
            expect(err).to.not.exist
            dagPB.util.cid(pbNode, (err, cid) => {
              expect(err).to.not.exist
              ipfs.dag.get(cid, (err, result) => {
                expect(err).to.not.exist
                const node = result.value
                expect(pbNode.toJSON()).to.eql(node.toJSON())
                done()
              })
            })
          })
        })

        it('dag-cbor node', (done) => {
          ipfs.dag.put(cborNode, {
            format: 'dag-cbor',
            hashAlg: 'sha2-256'
          }, (err) => {
            expect(err).to.not.exist
            dagCBOR.util.cid(cborNode, (err, cid) => {
              expect(err).to.not.exist
              ipfs.dag.get(cid, (err, result) => {
                expect(err).to.not.exist

                const node = result.value
                expect(cborNode).to.eql(node)
                done()
              })
            })
          })
        })

        describe('with path', () => {
          it('dag-pb get the node', (done) => {
            ipfs.dag.get(cidPb, '/', (err, result) => {
              expect(err).to.not.exist

              const node = result.value

              dagPB.util.cid(node, (err, cid) => {
                expect(err).to.not.exist
                expect(cid).to.eql(cidPb)
                done()
              })
            })
          })

          it('dag-pb local scope', (done) => {
            ipfs.dag.get(cidPb, 'data', (err, result) => {
              expect(err).to.not.exist
              expect(result.value).to.eql(new Buffer('I am inside a Protobuf'))
              done()
            })
          })

          it.skip('dag-pb one level', (done) => {})
          it.skip('dag-pb two levels', (done) => {})

          it('dag-cbor get the node', (done) => {
            ipfs.dag.get(cidCbor, '/', (err, result) => {
              expect(err).to.not.exist

              const node = result.value

              dagCBOR.util.cid(node, (err, cid) => {
                expect(err).to.not.exist
                expect(cid).to.eql(cidCbor)
                done()
              })
            })
          })

          it('dag-cbor local scope', (done) => {
            ipfs.dag.get(cidCbor, 'someData', (err, result) => {
              expect(err).to.not.exist
              expect(result.value).to.eql('I am inside a Cbor object')
              done()
            })
          })

          it.skip('dag-cbor one level', (done) => {})
          it.skip('dag-cbor two levels', (done) => {})
          it.skip('from dag-pb to dag-cbor', (done) => {})

          it('from dag-cbor to dag-pb', (done) => {
            ipfs.dag.get(cidCbor, 'pb/data', (err, result) => {
              expect(err).to.not.exist
              expect(result.value).to.eql(new Buffer('I am inside a Protobuf'))
              done()
            })
          })
        })
      })
    })

    describe('promise API', () => {
      describe('.put', () => {})
      describe('.get', () => {})
    })
  })
}
