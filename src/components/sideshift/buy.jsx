import React, { useEffect, useState, useCallback } from "react";
import { Container, Row, Col, Modal, FormControl } from "react-bootstrap";
import { IoMdClose } from "react-icons/io";
import { SIDESHIFTCONTEXT } from "../../contexts/sideShift";
import axios from "axios";

// 🔥 Cache map to avoid too many requests
const imageCache = new Map();

// ✅ GetImage handles both SVG + PNG
const GetImage = ({ url, newStyle }) => {
  const [image, setImage] = useState(null);
  const [isSvg, setIsSvg] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchImage = async () => {
      try {
        // Check cache first
        if (imageCache.has(url)) {
          const cached = imageCache.get(url);
          if (isMounted) {
            setIsSvg(cached.isSvg);
            setImage(cached.data);
          }
          return;
        }

        const res = await axios.get(url, { responseType: "text" });

        if (res.data.startsWith("<svg")) {
          // ✅ Raw SVG response
          if (isMounted) {
            setIsSvg(true);
            setImage(res.data);
            imageCache.set(url, { isSvg: true, data: res.data });
          }
        } else {
          // ✅ Normal PNG/JPG URL
          if (isMounted) {
            setIsSvg(false);
            setImage(url);
            imageCache.set(url, { isSvg: false, data: url });
          }
        }
      } catch (error) {
        // console.error("Image fetch error:", error);
      }
    };

    fetchImage();
    return () => {
      isMounted = false;
    };
  }, [url]);

  if (!image) return null;

  return (
    <div className="coin-inner mx-auto" style={newStyle}>
      {isSvg ? (
        <div dangerouslySetInnerHTML={{ __html: image }} />
      ) : (
        <img
          src={image}
          alt="coin"
          style={{ width: "100%", height: "auto" }}
          onError={(e) => (e.target.style.display = "none")}
        />
      )}
    </div>
  );
};

const BuyShift = ({ setFieldValue }) => {
  const { coins, setCoins, buyCoin, setBuyCoin, tempCoins } = SIDESHIFTCONTEXT();
  const [show, setShow] = useState(false);

  // ✅ Update form values when coin changes
  useEffect(() => {
    if (buyCoin) {
      setFieldValue("settleCoin", buyCoin.coin);
      setFieldValue("settleNetwork", buyCoin.network);
    }
  }, [buyCoin, setFieldValue]);

  const handleClose = useCallback(() => {
    setShow(false);
    setCoins(tempCoins); // reset to full list
  }, [setCoins, tempCoins]);

  const handleShow = () => setShow(true);

  const handleSelectedCoin = (item) => {
    setBuyCoin(item);
    handleClose();
  };

  // ✅ Fixed search logic
  const handleSearch = (value) => {
    if (!value) {
      setCoins(tempCoins);
      return;
    }

    const result = tempCoins.filter((item) =>
      item.coin.toLowerCase().includes(value.toLowerCase())
    );

    setCoins(result.length > 0 ? result : tempCoins);
  };

  return (
    <>
      {/* Selected Coin Display */}
      <div
        className="tabborder w-100 text-center p-3 pointer d-flex flex-column"
        onClick={handleShow}
      >
        <h6>Settle Network</h6>
        <GetImage
          url={`https://sideshift.ai/api/v2/coins/icon/${buyCoin.coin}-${buyCoin.network}`}
          newStyle={{ maxWidth: "50%", width: "100%", margin: "0 auto 10px auto" }}
        />
        <div>{buyCoin.name}</div>
        <div className="text-uppercase text-muted mb-2">
          <small>{buyCoin.coin}</small>
        </div>
        <div
          className="text-uppercase d-inline-block py-1 px-2"
          style={{ border: "2px solid white", minWidth: "100px" }}
        >
          {buyCoin.network}
        </div>
      </div>

      {/* Modal */}
      <Modal show={show} fullscreen onHide={handleClose}>
        <Modal.Body>
          <Row>
            <Col className="text-right">
              <IoMdClose className="pointer" size="30px" onClick={handleClose} />
            </Col>
          </Row>

          <h3 className="text-center">You Receive</h3>

          {/* Search Input */}
          <Row className="mb-3">
            <Col xs={12} md={6} xl={4} className="mx-auto">
              <FormControl
                name="search"
                placeholder="Search"
                className="text-center"
                onChange={(e) => handleSearch(e.target.value)}
              />
            </Col>
          </Row>

          {/* Coins Grid */}
          <Container>
            <Row>
              {coins?.length > 0 &&
                coins.map((item) =>
                  item.networks.map((network, index) => {
                    const isSelected =
                      `${item.name}-${network}` ===
                      `${buyCoin.name}-${buyCoin.network}`;

                    return (
                      <Col
                        key={`${item.coin}-${network}-${index}`}
                        className="my-3"
                      >
                        <div
                          className={`text-center py-3 ecosystem ${
                            isSelected ? "selectedecosystem" : ""
                          }`}
                          style={{ outline: "none", cursor: "pointer" }}
                          onClick={() =>
                            handleSelectedCoin({
                              coin: item.coin,
                              network,
                              name: item.name,
                            })
                          }
                        >
                          <GetImage
                            url={`https://sideshift.ai/api/v2/coins/icon/${item.coin}-${network}`}
                            newStyle={{
                              width: "200px",
                              maxWidth: "40%",
                              marginBottom: "10px",
                            }}
                          />

                          <div>{item.name}</div>
                          <div className="text-uppercase text-muted mb-2">
                            <small>{item.coin}</small>
                          </div>
                          <div
                            className="text-uppercase d-inline-block py-1 px-2"
                            style={{ border: "2px solid white", minWidth: "100px" }}
                          >
                            {network}
                          </div>
                        </div>
                      </Col>
                    );
                  })
                )}
            </Row>
          </Container>
        </Modal.Body>
      </Modal>
    </>
  );
};

export default BuyShift;
