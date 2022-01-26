import React from "react";
import "./index.css";
import { Server } from "./server.js";
import { Board } from './canvas.js';
import {getBounds} from './index.js';
import { GIF, notify, shortenAddress } from "../../utils";
import { NEIGHBORHOOD_SIZE, RPC, UPPER } from "../../constants";
import {
  Box,
  Button,
  FormControl,
  FormControlLabel,
  InputAdornment,
  MenuItem,
  Switch,
  TextField,
  Select,
  RadioGroup,
  Typography,
  Radio,
} from "@mui/material";
import { Spin, Tooltip } from "antd";
import { CopyOutlined } from "@ant-design/icons";
import Divider from "@mui/material/Divider";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import SearchIcon from "@mui/icons-material/Search";
import CancelIcon from "@mui/icons-material/Cancel";
import HelpIcon from "@mui/icons-material/Help";
import { solToLamports, lamportsToSol, formatPrice, intersection} from "../../utils";
import {Tab, Tabs, AppBar} from "@mui/material";


import ReactDOM from "react-dom";

import PropTypes from "prop-types";


function TabPanel(props) {
    const { children, value, index, ...other } = props;
  
    return (
      <Typography
        component="div"
        role="tabpanel"
        hidden={value !== index}
        id={`scrollable-auto-tabpanel-${index}`}
        aria-labelledby={`scrollable-auto-tab-${index}`}
        {...other}
      >
        <Box p={3}>{children}</Box>
      </Typography>
    );
  }
  
  TabPanel.propTypes = {
    children: PropTypes.node,
    index: PropTypes.any.isRequired,
    value: PropTypes.any.isRequired
  };
  
  function a11yProps(index) {
    return {
      id: `scrollable-auto-tab-${index}`,
      "aria-controls": `scrollable-auto-tabpanel-${index}`
    };
  }

export class SelectingSidebar extends React.Component {
    constructor(props) {
      super(props);
      this.state = {value: 0, ownedSelection: new Set()};
      this.handleTabChange = this.handleTabChange.bind(this);
      this.selectionSize = 0;
    }

    componentDidMount(){
        this.setState({ownedSelection: intersection(this.props.ownedSpaces, this.props.selecting.poses)});
        this.selectionSize = this.props.selecting.poses.size;
    }

    componentDidUpdate(prevProps) {
        if (this.props.ownedSpaces != prevProps.ownedSpaces || this.props.selecting.poses != prevProps.selecting.poses
            || this.props.selecting.poses.size != this.selectionSize) {
                this.setState({ownedSelection: intersection(this.props.ownedSpaces, this.props.selecting.poses)});
                this.selectionSize = this.props.selecting.poses.size;
        }

        // draw image on sidebar
        let reader = new FileReader();
        reader.onload = function (e) {
            let bfile = e.target.result;

            let image = new Image();

            // draw image in sidebar
            const img = document.getElementById("img-render");

            let bounds = getBounds(this.props.selecting.poses);
            const height = bounds.bottom - bounds.top + 1;
            const width = bounds.right - bounds.left + 1;

            let imgwidth;
            let imgheight;

            if (width >= height) {
                imgwidth = 0.6*this.props.canvasSize;
                imgheight = (height/width) * imgwidth;
            }
            else {
                imgheight = 0.6*this.props.canvasSize;
                imgwidth = (width/height) * imgheight;
            }

            image.onload = function () {
                const context = img.getContext("2d", {
                    alpha: false,
                    desynchronized: true,
                });
                context.clearRect(0, 0, img.width, img.height);
                context.fillStyle = "#000000";
                context.fillRect(0, 0, img.width, img.height);
                context.drawImage(image, 0, 0, imgwidth, imgheight);
            }.bind(this);
            image.setAttribute("src",bfile);
        }.bind(this);

        if (this.props.img_upl !== null) {
          reader.readAsDataURL(this.props.img_upl);
        }
    }

    handleTabChange(event, newValue) {
        this.setState({value: newValue});
        this.props.resetTargets();
    };

    render() {
        let bounds = getBounds(this.props.selecting.poses);

        const sidebarHeader = <List style={{ marginTop: "0px" }}>
        <ListItem className="info" style={{ display: "block" }}>
          <Box className="infoHeader">OWNED SPACES</Box>
          <Box>
            <b>
              <font color="#82CBC5">
                {this.state.ownedSelection.size +
                  "/" +
                  this.props.selecting.poses.size}
              </font>
            </b>
          </Box>
        </ListItem>
        </List>;

        let tooltipModifyColorTitle = `Estimated Cost to Change Colors:  ${(this.state.ownedSelection.size * 0.000005).toFixed(6)} SOL`;
        let tooltipSetPriceTitle = `Estimated Cost to List/Delist:  ${(this.state.ownedSelection.size * 0.000005).toFixed(6)} SOL`;
        let tooltipBuyTitle = `Batch buying is non-atomic and is available as a convenience feature. Successful purchase of every Space selected is not guaranteed.
        
        Estimated Transaction Cost to Buy:  ${(this.props.selecting.purchasableInfo.length * 0.000005).toFixed(6)} SOL`;
        
        return (

                <div>
                  <AppBar position="static" color="default">
                    <Tabs
                      value={this.state.value}
                      onChange={ this.handleTabChange }
                      indicatorColor="primary"
                      textColor="primary"
                      variant="scrollable"
                      scrollButtons="auto"
                      aria-label="scrollable auto tabs example"
                    >
                      <Tab label="Modify" {...a11yProps(0)} />
                      <Tab label="Price Info" {...a11yProps(1)} />
                      <Tab label="Rent Info" {...a11yProps(2)} />
                      <Tab label="Advanced" {...a11yProps(3)} />
                    </Tabs>
                  </AppBar>

                  

                  <TabPanel value={this.state.value} index={0}>
                      {sidebarHeader}

                      {/* Color stuff */}

                      <Divider className="sidebarDivider">
                          Modify Colors
                      </Divider>
                      <ListItem className="info" style={{ display: "block" }}>
                        {/* <Box className="infoText2">
                          Estimated Cost:{" "}
                          {(this.state.ownedSelection.size * 0.000005).toFixed(6)} SOL
                        </Box> */}
                        <RadioGroup
                          row
                          value={this.props.colorApplyAll}
                          onChange={(e) => {
                            this.props.handleChangeColorApplyAll(e);
                          }}
                        >
                          <FormControlLabel
                            value={false}
                            control={<Radio size="small" />}
                            label={
                              <Typography
                                className="infoText2"
                              >{`Current frame (Frame ${this.props.frame})`}</Typography>
                            }
                          />
                          <FormControlLabel
                            value={true}
                            control={<Radio size="small" />}
                            label={
                              <Typography className="infoText2">
                                All frames
                              </Typography>
                            }
                          />
                        </RadioGroup>
                        <Tooltip placement={'right'} title={tooltipModifyColorTitle}>
                          <Box className="infoHeader">COLOR</Box>
                        </Tooltip>
                        <div style={{ display: "flex", alignItems: "center" }}>
                          <input
                            className="newColor"
                            type="color"
                            value={this.props.selecting.color}
                            onChange={(e) => this.props.handleChangeColors(e)}
                            disabled={!this.state.ownedSelection.size}
                          ></input>
                        <Tooltip placement={'right'} title={tooltipModifyColorTitle}>
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() => {
                              this.props.changeColors();
                            }}
                            style={{
                              marginLeft: "5px",
                              color: "#FFFFFF",
                              background: "linear-gradient(to right bottom, #36EAEF7F, #6B0AC97F)",
                            }}
                            disabled={!this.state.ownedSelection.size}
                          >
                            Change Color
                          </Button>
                        </Tooltip>
                        </div>

                        <Box className="infoHeader" style={{marginTop: "10px"}}>IMAGE</Box>
                        <div style={{ display: "flex", alignItems: "center" }}>
                          <Tooltip placement={'right'} title="Upload an image on your selected spaces">
                            <Button
                              variant="contained"
                              component="label"
                              style={{ width: "100%" }}
                              size="small"
                              disabled={!this.state.ownedSelection.size}
                              style={{
                                marginLeft: "5px",
                                color: "#FFFFFF",
                                background: "linear-gradient(to right bottom, #36EAEF7F, #6B0AC97F)",
                              }}
                            >
                              Choose File
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => this.props.handleChangeImg(e)}
                                hidden
                              />
                            </Button>
                          </Tooltip>
                          {this.props.hasImage && 
                            <Box className="infoText1" style={{marginLeft: "10px"}}>
                              {this.props.img_upl.name}
                            </Box> 
                          }
                        </div>
                        {/* {this.props.hasImage &&  */}
                        <canvas id="img-render" style={{marginTop: "20px"}} width={0.6*this.props.canvasSize + "px"} height={0.6*this.props.canvasSize + "px"}/> 
                          {/* } */}
                        <Tooltip placement={'right'} title={tooltipModifyColorTitle}>
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() => {
                              this.props.uploadImage();
                            }}
                            style={{
                              width: "100%",
                              marginTop: "20px",
                              color: "#FFFFFF",
                              background: "linear-gradient(to right bottom, #36EAEF7F, #6B0AC97F)",
                            }}
                            disabled={!this.props.hasImage}
                          >
                            Upload
                          </Button>
                        </Tooltip>
                      </ListItem>            
                  </TabPanel>


                    
                  <TabPanel value={this.state.value} index={1}>
                      {sidebarHeader}
                          
                      {/* Purchase info */}

                      <Divider className="sidebarDivider">
                          Modify Listing
                      </Divider>
                      <ListItem className="info" style={{ display: "block" }}>
                        {/* <Box className="infoText2">
                          Estimated Cost:{" "}
                          {(this.state.ownedSelection.size * 0.000005).toFixed(6)} SOL
                        </Box> */}
                        <Tooltip placement={'right'} title={tooltipSetPriceTitle}>
                          <Box className="infoHeader">PRICE</Box>
                        </Tooltip>
                        <TextField
                          hiddenLabel
                          id="price-textfield"
                          value={
                            this.props.selecting.price === null
                              ? ""
                              : this.props.selecting.price
                          }
                          onChange={(e) => this.props.handleChangeSelectingPrice(e)}
                          style={{
                            width: "100%",
                            height: "30px",
                          }}
                          variant="filled"
                          size="small"
                          disabled={!this.state.ownedSelection.size}
                          InputProps={{
                            endAdornment: (
                              <InputAdornment position="end">SOL</InputAdornment>
                            ),
                          }}
                        />
                        <Tooltip placement={'right'} title={tooltipSetPriceTitle}>
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() => {
                              this.props.changePrices();
                            }}
                            style={{
                              width: "100%",
                              marginTop: "20px",
                              color: "#FFFFFF",
                              background: "linear-gradient(to right bottom, #36EAEF7F, #6B0AC97F)",
                            }}
                            disabled={
                              !this.state.ownedSelection.size ||
                              this.props.selecting.price === null
                            }
                          >
                            Set Price
                          </Button>
                        </Tooltip>
                        <Tooltip placement={'right'} title={tooltipSetPriceTitle}>
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() => {
                              this.props.delistSpaces();
                            }}
                            style={{
                              width: "100%",
                              marginTop: "10px",
                              color: "#FFFFFF",
                              background: "linear-gradient(to right bottom, #36EAEF7F, #6B0AC97F)",
                            }}
                            disabled={!this.state.ownedSelection.size}
                          >
                            Delist
                          </Button>
                        </Tooltip>
                      </ListItem>
                      <Divider className="sidebarDivider" style={{marginTop: "20px"}}>
                          Purchase Spaces
                      </Divider>
                      <ListItem className="info" style={{ display: "block" }}>
                        <Box className="infoText1">
                          Targeted cells count
                        </Box>
                        <Box
                          style={{
                            filter:
                              this.props.selecting.loadingPricesStatus === 1
                                ? "blur(0.5rem)"
                                : "blur(0)",
                            transition: "0.5s",
                          }}
                        >
                          <b>
                            <font color="#82CBC5" style={{ marginLeft: "5px" }}>
                              {
                              this.props.selecting.loadingPricesStatus !== 2
                                ? "not loaded"
                              :
                                this.props.selecting.purchasableInfo.length +
                                "/" +
                                this.props.selecting.poses.size}
                            </font>
                          </b>
                        </Box>
                      </ListItem>
                      <ListItem className="info" style={{ display: "block" }}>
                        <Box className="infoText1">Total Price</Box>
                        <Box
                          style={{
                            filter:
                              this.props.selecting.loadingPricesStatus === 1
                                ? "blur(0.5rem)"
                                : "blur(0)",
                            transition: "0.5s",
                          }}
                        >
                          <img
                            src={
                              require("../../assets/images/solana-transparent.svg").default
                            }
                            alt="SOL"
                          />
                          <b>
                            <font color="#82CBC5" style={{ marginLeft: "5px" }}>
                              { 
                              this.props.selecting.loadingPricesStatus !== 2
                                ? "not loaded"
                                :
                                formatPrice(this.props.selecting.totalPrice)
                              }
                            </font>
                          </b>
                        </Box>
                      </ListItem>
                      <ListItem className="info" style={{ display: "block" }}>
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => {
                            this.props.loadPurchasableInfo();
                          }}
                          style={{
                            width: "100%",
                            marginLeft: "5px",
                            color: "#FFFFFF",
                            background: "linear-gradient(to right bottom, #36EAEF7F, #6B0AC97F)",
                          }}
                        >
                          Load Price Info
                        </Button>
                      </ListItem>
                      <ListItem className="info" style={{ display: "block" }}>
                        <Tooltip placement={'right'} title="Select all purchasable Spaces in your selection to prepare to purchase them.">
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() => {
                              this.props.handleTargetAll();
                            }}
                
                            disabled={this.props.selecting.loadingPricesStatus != 2}
                            style={{
                              width: "100%",
                              marginLeft: "5px",
                              color: "#FFFFFF",
                              background: "linear-gradient(to right bottom, #36EAEF7F, #6B0AC97F)",
                            }}
                          >
                            Target All Purchasable
                          </Button>
                        </Tooltip>
                      </ListItem>
                      <ListItem className="info" style={{ display: "block" }}>
                        <div style={{ display: "flex", alignItems: "center" }}>
                          <TextField
                            required
                            id="outlined-required"
                            label="width"
                            type="number"
                            defaultValue={1}
                            onChange={(e) => this.props.handleChangeFloorM(e)}
                            value={this.props.selecting.floorM}
                            disabled={this.props.selecting.loadingPricesStatus != 2}
                            style={{ width: "25%" }}
                            size="small"
                          />
                          <TextField
                            required
                            id="outlined-required"
                            label="height"
                            type="number"
                            defaultValue={1}
                            onChange={(e) => this.props.handleChangeFloorN(e)}
                            value={this.props.selecting.floorN}
                            disabled={this.props.selecting.loadingPricesStatus != 2}
                            style={{ width: "25%" }}
                            size="small"
                          />
                          <Tooltip placement={'right'} title="Select the cheapest rectangle in your selection of the specified width and height dimensions.">
                            <Button
                              size="small"
                              variant="contained"
                              onClick={() => {
                                this.props.handleTargetFloor();
                              }}
                              disabled={this.props.selecting.loadingPricesStatus != 2}
                              style={{
                                width: "45%",
                                marginLeft: "10px",
                                marginTop: "5px",
                                marginLeft: "5px",
                                color: "#FFFFFF",
                                background: "linear-gradient(to right bottom, #36EAEF7F, #6B0AC97F)",
                              }}
                            >
                              Target Floor
                            </Button>
                          </Tooltip>
                        </div>
                        {/* <FormControl style={{alignItems: "center"}}>
                                        <FormControlLabel
                                            control={
                                                <Switch 
                                                onChange={(e) => this.handleTargetFloor(e)} 
                                                checked={this.props.floor}
                                                disabled={this.props.selecting.loadingPricesStatus != 2}
                                                />
                                            } 
                                            label="SHOW FLOOR"
                                        />
                                    </FormControl> */}
                      </ListItem>
                      <ListItem className="info" style={{ display: "block" }}>
                        <Tooltip placement={'right'} title={tooltipBuyTitle}>
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() => {
                              this.props.purchaseSpaces();
                            }}
                            style={{
                              width: "100%",
                              color: "#FFFFFF",
                              background: "linear-gradient(to right bottom, #36EAEF7F, #6B0AC97F)",
                            }}
                            disabled={
                              !this.props.user ||
                              this.props.selecting.loadingPricesStatus != 2 ||
                              this.props.selecting.purchasable.size === 0
                            }
                          >
                            Buy Now
                          </Button>
                        </Tooltip>
                      </ListItem>
                  </TabPanel>

                  
                  <TabPanel value={this.state.value} index={2}>
                      {sidebarHeader}
                          
                      {/* Purchase info */}

                      <Divider className="sidebarDivider">
                          Modify Rent
                      </Divider>
                      <ListItem className="info" style={{ display: "block" }}>
                        {/* <Box className="infoText2">
                          Estimated Cost:{" "}
                          {(this.state.ownedSelection.size * 0.000005).toFixed(6)} SOL
                        </Box> */}
                        <Tooltip placement={'right'} title={tooltipSetPriceTitle}>
                          <Box className="infoHeader">PRICE</Box>
                        </Tooltip>
                        <TextField
                          hiddenLabel
                          id="price-textfield"
                          value={
                            this.props.selecting.rentPrice === null
                              ? ""
                              : this.props.selecting.rentPrice
                          }
                          onChange={(e) => this.props.handleChangeSelectingRentPrice(e)}
                          style={{
                            width: "100%",
                            height: "30px",
                          }}
                          variant="filled"
                          size="small"
                          disabled={!this.state.ownedSelection.size}
                          InputProps={{
                            endAdornment: (
                              <InputAdornment position="end">SOL</InputAdornment>
                            ),
                          }}
                        />
                        <Tooltip placement={'right'} title={tooltipSetPriceTitle}>
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() => {
                              this.props.changeRents();
                            }}
                            style={{
                              width: "100%",
                              marginTop: "20px",
                              color: "#FFFFFF",
                              background: "linear-gradient(to right bottom, #36EAEF7F, #6B0AC97F)",
                            }}
                            disabled={
                              !this.state.ownedSelection.size ||
                              this.props.selecting.rentPrice === null
                            }
                          >
                            Set Rent
                          </Button>
                        </Tooltip>
                        <Tooltip placement={'right'} title={tooltipSetPriceTitle}>
                          <Button
                            size="small"
                            variant="contained"ent
                            onClick={() => {
                              this.props.delistRents();
                            }}
                            style={{
                              width: "100%",
                              marginTop: "10px",
                              color: "#FFFFFF",
                              background: "linear-gradient(to right bottom, #36EAEF7F, #6B0AC97F)",
                            }}
                            disabled={!this.state.ownedSelection.size}
                          >
                            Delist Rent
                          </Button>
                        </Tooltip>
                      </ListItem>
                      <Divider className="sidebarDivider" style={{marginTop: "20px"}}>
                          Rent Spaces
                      </Divider>
                      <ListItem className="info" style={{ display: "block" }}>
                        <Box className="infoText1">
                          Targeted cells count
                        </Box>
                        <Box
                          style={{
                            filter:
                              this.props.selecting.loadingPricesStatus === 1
                                ? "blur(0.5rem)"
                                : "blur(0)",
                            transition: "0.5s",
                          }}
                        >
                          <b>
                            <font color="#82CBC5" style={{ marginLeft: "5px" }}>
                              {
                              this.props.selecting.loadingRentStatus !== 2
                                ? "not loaded"
                              :
                                this.props.selecting.rentableInfo.length +
                                "/" +
                                this.props.selecting.poses.size}
                            </font>
                          </b>
                        </Box>
                      </ListItem>
                      <ListItem className="info" style={{ display: "block" }}>
                        <Box className="infoText1">Total Price</Box>
                        <Box
                          style={{
                            filter:
                              this.props.selecting.loadingRentStatus === 1
                                ? "blur(0.5rem)"
                                : "blur(0)",
                            transition: "0.5s",
                          }}
                        >
                          <img
                            src={
                              require("../../assets/images/solana-transparent.svg").default
                            }
                            alt="SOL"
                          />
                          <b>
                            <font color="#82CBC5" style={{ marginLeft: "5px" }}>
                              { 
                              this.props.selecting.loadingRentStatus !== 2
                                ? "not loaded"
                                :
                                formatPrice(this.props.selecting.totalRentPrice)
                              }
                            </font>
                          </b>
                        </Box>
                      </ListItem>
                      <ListItem className="info" style={{ display: "block" }}>
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => {
                            this.props.loadRentableInfo();
                          }}
                          style={{
                            width: "100%",
                            marginLeft: "5px",
                            color: "#FFFFFF",
                            background: "linear-gradient(to right bottom, #36EAEF7F, #6B0AC97F)",
                          }}
                        >
                          Load Rent Info
                        </Button>
                      </ListItem>
                      <ListItem className="info" style={{ display: "block" }}>
                        <Tooltip placement={'right'} title="Select all purchasable Spaces in your selection to prepare to purchase them.">
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() => {
                              this.props.handleTargetRentAll();
                            }}
                
                            disabled={this.props.selecting.loadingRentStatus != 2}
                            style={{
                              width: "100%",
                              marginLeft: "5px",
                              color: "#FFFFFF",
                              background: "linear-gradient(to right bottom, #36EAEF7F, #6B0AC97F)",
                            }}
                          >
                            Target All Rentable
                          </Button>
                        </Tooltip>
                      </ListItem>
                      <ListItem className="info" style={{ display: "block" }}>
                        <div style={{ display: "flex", alignItems: "center" }}>
                          <TextField
                            required
                            id="outlined-required"
                            label="width"
                            type="number"
                            defaultValue={1}
                            onChange={(e) => this.props.handleChangeFloorM(e)}
                            value={this.props.selecting.floorM}
                            disabled={this.props.selecting.loadingRentStatus != 2}
                            style={{ width: "25%" }}
                            size="small"
                          />
                          <TextField
                            required
                            id="outlined-required"
                            label="height"
                            type="number"
                            defaultValue={1}
                            onChange={(e) => this.props.handleChangeFloorN(e)}
                            value={this.props.selecting.floorN}
                            disabled={this.props.selecting.loadingRentStatus != 2}
                            style={{ width: "25%" }}
                            size="small"
                          />
                          <Tooltip placement={'right'} title="Select the cheapest rectangle in your selection of the specified width and height dimensions.">
                            <Button
                              size="small"
                              variant="contained"
                              onClick={() => {
                                this.props.handleTargetRentFloor();
                              }}
                              disabled={this.props.selecting.loadingRentStatus != 2}
                              style={{
                                width: "45%",
                                marginLeft: "10px",
                                marginTop: "5px",
                                marginLeft: "5px",
                                color: "#FFFFFF",
                                background: "linear-gradient(to right bottom, #36EAEF7F, #6B0AC97F)",
                              }}
                            >
                              Target Floor
                            </Button>
                          </Tooltip>
                        </div>
                        {/* <FormControl style={{alignItems: "center"}}>
                                        <FormControlLabel
                                            control={
                                                <Switch 
                                                onChange={(e) => this.handleTargetFloor(e)} 
                                                checked={this.props.floor}
                                                disabled={this.props.selecting.loadingPricesStatus != 2}
                                                />
                                            } 
                                            label="SHOW FLOOR"
                                        />
                                    </FormControl> */}
                      </ListItem>
                      <ListItem className="info" style={{ display: "block" }}>
                        <Tooltip placement={'right'} title={tooltipBuyTitle}>
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() => {
                              this.props.rentSpaces();
                            }}
                            style={{
                              width: "100%",
                              color: "#FFFFFF",
                              background: "linear-gradient(to right bottom, #36EAEF7F, #6B0AC97F)",
                            }}
                            disabled={
                              !this.props.user ||
                              this.props.selecting.loadingRentStatus != 2 ||
                              this.props.selecting.rentable.size === 0
                            }
                          >
                            Rent Now
                          </Button>
                        </Tooltip>
                      </ListItem>
                  </TabPanel>


                  <TabPanel value={this.state.value} index={3}>
                        {sidebarHeader}

                        {/* Advanced */}
                        <> 
                        <Divider className="sidebarDivider">
                            Advanced
                        </Divider>
                        <ListItem className="info" style={{ display: "block" }}>
                              <Tooltip placement={'right'} title="Refresh information for these Spaces directly from the blockchain. Refreshing may be rate-limited if performed excessively.">  
                                <Button
                                size="small"
                                variant="contained"
                                onClick={() => {
                                    this.props.handleSelectingRefresh();
                                }}
                                style={{
                                    width: "100%",
                                    color: "#FFFFFF",
                                    background: "linear-gradient(to right bottom, #36EAEF7F, #6B0AC97F)",
                                }}
                                >
                                    Refresh Info
                                </Button>
                              </Tooltip>
                            </ListItem>
                        <ListItem className="info" style={{ display: "block" }}>
                            <Typography align="center">
                              <Tooltip placement={'right'} title="Copy link to the rectangular box containing the selected pixels.">
                                <Button
                                    size="small"
                                    variant="contained"
                                    onClick={() => {
                                        let prefix = window.location.hostname;
                                        if (window.location.port) { // for localhost
                                            prefix += ":" + window.location.port;
                                        }
                                        const fraction = Math.round(this.props.scale * NEIGHBORHOOD_SIZE / this.props.height * 100);
                                        navigator.clipboard.writeText(`https://${prefix}/rect/${bounds.left}/${bounds.right}/${bounds.top}/${bounds.bottom}/${fraction}`);
                                        notify({
                                        description: "URL copied to clipboard",
                                        });
                                    }}
                                    disabled={!this.props.scale}
                                    style={{
                                        width: "100%",
                                        color: "#FFFFFF",
                                        background: "linear-gradient(to right bottom, #36EAEF7F, #6B0AC97F)",
                                    }}
                                    >
                                        <CopyOutlined />
                                        Share Rectangular Bounding
                                </Button>
                              </Tooltip>
                            </Typography>
                        </ListItem>
                        </>
                    </TabPanel>
                </div>
        )
    }
}