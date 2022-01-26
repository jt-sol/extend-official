import React from "react";
import "./index.css";
import { formatPrice, notify, shortenAddress } from "../../utils";
import { NEIGHBORHOOD_SIZE } from "../../constants";
import {
  AppBar,
  Box,
  Button,
  FormControlLabel,
  InputAdornment,
  TextField,
  RadioGroup,
  Typography,
  Radio,
  Tab,
  Tabs
} from "@mui/material";
import { Spin, Tooltip } from "antd";
import { CopyOutlined } from "@ant-design/icons";
import Divider from "@mui/material/Divider";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";

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

  
  
export class FocusSidebar extends React.Component {
    constructor(props) {
      super(props);
      this.state = {value: 0, owned: false};
      this.handleTabChange = this.handleTabChange.bind(this);
    }

    componentDidMount(){
        this.setState({
            owned: (this.props.ownedSpaces &&
                this.props.ownedSpaces.has(JSON.stringify({ x: this.props.focus.x, y: this.props.focus.y })))
        });
    }
    
    componentDidUpdate(prevProps) {
        if (this.props.ownedSpaces !== prevProps.ownedSpaces || this.props.focus.x != prevProps.focus.x || this.props.focus.y != prevProps.focus.y) {  
            this.setState({
                owned: (this.props.ownedSpaces &&
                    this.props.ownedSpaces.has(JSON.stringify({ x: this.props.focus.x, y: this.props.focus.y })))
            });
        }
    }

    handleTabChange(event, newValue) {
        this.setState({value: newValue});
    };

    

    render() {
        let priceInfoName = this.state.owned ? "Listing" : "Purchase";

        const sidebarHeader = <>
        <List>
            <ListItem>
            <div style={{display: 'flex',  justifyContent:'center', alignItems:'center'}}>
                <img
                    src={`https://metadata.extend.xyz/api/artwork?ext=png&x=${this.props.focus.x}&y=${this.props.focus.y}`}
                    style={this.props.focus.infoLoaded && this.props.focus.imgLoaded ? {maxWidth: "30%"} : {display: 'none'}}
                    className="center"
                    onLoad={() => this.props.handleOnImgLoad()}
                ></img>
            </div>
            </ListItem>
        </List>
        {(!this.props.focus.infoLoaded || !this.props.focus.imgLoaded) ? 
        <List>
            <ListItem className="info" style={{ display: "block"}}>
            <Spin size="large" style={{ marginTop: "50px", width: "100%"}} />
            </ListItem>
        </List> : (
        <>
        <List id="focusSidebarPrefix">
            <ListItem className="info" style={{ display: "block" }}>
                <Box className="infoHeader">POSITION</Box>
                <Box>
                <b>
                    <font color="#82CBC5">
                    X={this.props.focus.x}, Y={this.props.focus.y}
                    </font>
                </b>
                </Box>
            </ListItem>
            <ListItem className="info" style={{ display: "block" }}>
                <Box className="infoHeader">NEIGHBORHOOD</Box>
                <Box>
                <b>
                    <font color="#82CBC5">
                    {this.props.focus.neighborhood_name ? this.props.focus.neighborhood_name : "NONE"}
                    </font>
                </b>
                </Box>
            </ListItem>
            <ListItem className="info" style={{ display: "block" }}>
                <Box className="infoHeader">
                    {this.state.owned ? "OWNER (YOU)" : "OWNER"}
                </Box>
                <Box>
                <Button
                    size="small"
                    variant="text"
                    onClick={async () => {
                    if (this.props.focus.owner) {
                        navigator.clipboard.writeText(this.props.focus.owner.toBase58());
                        notify({
                            description: "Address copied to clipboard",
                        });
                    }
                    }}
                    style={{ padding: 0 }}
                    disabled={!this.props.focus.owner}
                >
                    {this.props.focus.owner ? (
                    <>
                        <CopyOutlined />
                        {shortenAddress(this.props.focus.owner.toBase58())}
                    </>
                    ) : (
                    "NONE"
                    )}
                </Button>
                </Box>
            </ListItem>
            <ListItem className="info" style={{ display: "block" }}>
                <Box className="infoHeader">
                    MINT
                </Box>
                <Box>
                <Button
                    size="small"
                    variant="text"
                    onClick={async () => {
                    if (this.props.focus.mint) {
                        navigator.clipboard.writeText(this.props.focus.mint.toBase58());
                        notify({
                            description: "Address copied to clipboard",
                        });
                    }
                    }}
                    style={{ padding: 0 }}
                    disabled={!this.props.focus.mint}
                >
                    {this.props.focus.mint ? (
                    <>
                        <CopyOutlined />
                        {shortenAddress(this.props.focus.mint.toBase58())}
                    </>
                    ) : (
                    "NONE"
                    )}
                </Button>
                </Box>
            </ListItem>
        </List>
        </>)}
        </>;
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
                        <Tab label={priceInfoName} {...a11yProps(1)} />
                        <Tab label="Advanced" {...a11yProps(2)} />
                        <Tab label="Rent" {...a11yProps(2)} />
                      </Tabs>
                    </AppBar>


                    <TabPanel value={this.state.value} index={0}>
                        {sidebarHeader}

                        {/* Color stuff */}
                        {(!this.props.focus.infoLoaded || !this.props.focus.imgLoaded) ?
                            null
                            :
                            (<List>
                                <Divider className="sidebarDivider">
                                    Modify Color
                                </Divider>
                                <ListItem className="info" style={{ display: "block" }}>
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
                                        disabled={!this.state.owned}
                                        label={
                                        <Typography
                                            className="infoText2"
                                        >{`Current frame (Frame ${this.props.frame})`}</Typography>
                                        }
                                    />
                                    <FormControlLabel
                                        value={true}
                                        control={<Radio size="small" />}
                                        disabled={!this.state.owned}
                                        label={
                                        <Typography className="infoText2">
                                            All frames
                                        </Typography>
                                        }
                                    />
                                    </RadioGroup>
                                    <Box className="infoHeader">COLOR</Box>
                                    <div style={{ display: "flex", alignItems: "center" }}>
                                    <input
                                        className="newColor"
                                        type="color"
                                        value={this.props.focus.color}
                                        onChange={(e) => this.props.handleChangeColor(e)}
                                        disabled={!this.state.owned}
                                    ></input>
                                    <Button
                                        size="small"
                                        variant="contained"
                                        onClick={() => {
                                            this.props.changeColor();
                                        }}
                                        style={{
                                        marginLeft: "5px",
                                        color: "#FFFFFF",
                                        background: "linear-gradient(to right bottom, #36EAEF7F, #6B0AC97F)",
                                        }}
                                        disabled={!this.state.owned}
                                    >
                                        Change Color
                                    </Button>
                                    </div>
                                </ListItem>
                            </List>)
                        }
                    </TabPanel>


                    
                    <TabPanel value={this.state.value} index={1}>
                        {sidebarHeader}

                        {/* purchase info */}
                        
                        {(!this.props.focus.infoLoaded || !this.props.focus.imgLoaded) ?
                            null
                            :
                            <>
                            {!this.state.owned && this.props.focus.hasPrice ? 
                                <>
                                <Divider className="sidebarDivider">
                                    Purchase Space
                                </Divider>
                                <ListItem className="info" style={{ display: "block" }}>
                                    <Box className="infoHeader">PRICE</Box>
                                    <Box>
                                    <img
                                        src={
                                        require("../../assets/images/solana-transparent.svg")
                                            .default
                                        }
                                        alt="SOL"
                                    />
                                    <b>
                                        <font color="#82CBC5" style={{ marginLeft: "5px" }}>
                                        {this.props.focus.hasPrice
                                            ? formatPrice(this.props.focus.price)
                                            : "NONE"}
                                        </font>
                                    </b>
                                    </Box>
                                </ListItem>
                                <ListItem className="info" style={{ display: "block" }}>
                                    <Button
                                    size="small"
                                    variant="contained"
                                    onClick={() => {
                                        this.props.purchaseSpace();
                                    }}
                                    style={{
                                        width: "100%",
                                        color: "#FFFFFF",
                                        background: "linear-gradient(to right bottom, #36EAEF7F, #6B0AC97F)",
                                    }}
                                    disabled={!this.props.user}
                                    >
                                    Buy Now
                                    </Button>
                                </ListItem>
                                </>
                            : 
                                (!this.state.owned && !this.props.focus.hasPrice ?
                                    (<Divider className="sidebarDivider">
                                        Space Not Listed
                                    </Divider>) : null
                                )
                            }
                            {this.state.owned ? (
                                // <Box sx={{ display: 'flex', color: '#173A5E', bgcolor: 'black' }}>
                                <>
                                <Divider className="sidebarDivider">
                                    Modify Listing
                                </Divider>
                                <ListItem className="info" style={{ display: "block" }}>
                                    <Box className="infoHeader">PRICE</Box>
                                    <TextField
                                    hiddenLabel
                                    id="price-textfield"
                                    value={
                                        this.props.focus.price === null ? "" : this.props.focus.price
                                    }
                                    onChange={(e) => this.props.handleChangeFocusPrice(e)}
                                    style={{
                                        width: "100%",
                                        height: "30px",
                                    }}
                                    variant="filled"
                                    size="small"
                                    InputProps={{
                                        endAdornment: (
                                        <InputAdornment position="end">SOL</InputAdornment>
                                        ),
                                    }}
                                    />
                                    <Button
                                    size="small"
                                    variant="contained"
                                    onClick={() => {
                                        this.props.changePrice();
                                    }}
                                    style={{
                                        width: "100%",
                                        marginTop: "20px",
                                        color: "#FFFFFF",
                                        background: "linear-gradient(to right bottom, #36EAEF7F, #6B0AC97F)",
                                    }}
                                    disabled={this.props.focus.price === null}
                                    >
                                    Set Price
                                    </Button>
                                    {this.props.focus.hasPrice ? (
                                    <Button
                                        size="small"
                                        variant="contained"
                                        onClick={() => {
                                        this.props.delistSpace();
                                        }}
                                        style={{
                                        width: "100%",
                                        marginTop: "10px",
                                        color: "#FFFFFF",
                                        background: "linear-gradient(to right bottom, #36EAEF7F, #6B0AC97F)",
                                        }}
                                    >
                                        Delist
                                    </Button>
                                    ) : null}
                                </ListItem>
                                </>
                            ) : null}
                            </>
                        }
                    </TabPanel>

                    <TabPanel value={this.state.value} index={2}>
                        {sidebarHeader}

                        {/* Advanced */}

                        {(!this.props.focus.infoLoaded || !this.props.focus.imgLoaded) ?
                            null
                            :   
                            <> 
                            <Divider className="sidebarDivider">
                                Advanced
                            </Divider>
                            <ListItem className="info" style={{ display: "block" }}>
                                <Tooltip placement={'right'} title="Refresh information for this Space directly from the blockchain. Refreshing may be rate-limited if performed excessively.">
                                    <Button
                                    size="small"
                                    variant="contained"
                                    onClick={() => {
                                        this.props.handleFocusRefresh();
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
                                    <Tooltip placement={'right'} title="Copy link to Space">
                                        <Button
                                            size="small"
                                            variant="contained"
                                            onClick={() => {
                                                let prefix = window.location.hostname;
                                                if (window.location.port) { // for localhost
                                                    prefix += ":" + window.location.port;
                                                }
                                                const fraction = Math.round(this.props.scale * NEIGHBORHOOD_SIZE / this.props.height * 100);
                                                navigator.clipboard.writeText(`https://${prefix}/space/${this.props.focus.x}/${this.props.focus.y}/${fraction}`);
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
                                                Share This Space
                                        </Button>
                                    </Tooltip>
                                </Typography>
                            </ListItem>
                            </>
                        }
                    </TabPanel>

                    <TabPanel value={this.state.value} index={3}>
                        {sidebarHeader}

                        {/* purchase info */}
                        
                        {(!this.props.focus.infoLoaded || !this.props.focus.imgLoaded) ?
                            null
                            :
                            <>
                            {!this.state.owned && this.props.focus.hasRentPrice ? 
                                <>
                                <Divider className="sidebarDivider">
                                    Rent Space
                                </Divider>
                                <ListItem className="info" style={{ display: "block" }}>
                                    <Box className="infoHeader">PRICE</Box>
                                    <Box>
                                    <img
                                        src={
                                        require("../../assets/images/solana-transparent.svg")
                                            .default
                                        }
                                        alt="SOL"
                                    />
                                    <b>
                                        <font color="#82CBC5" style={{ marginLeft: "5px" }}>
                                        {this.props.focus.hasRentPrice
                                            ? formatPrice(this.props.focus.rentPrice)
                                            : "NONE"}
                                        </font>
                                    </b>
                                    </Box>
                                </ListItem>
                                <ListItem className="info" style={{ display: "block" }}>
                                    <Button
                                    size="small"
                                    variant="contained"
                                    onClick={() => {
                                        this.props.rentSpace();
                                    }}
                                    style={{
                                        width: "100%",
                                        color: "#FFFFFF",
                                        background: "linear-gradient(to right bottom, #36EAEF7F, #6B0AC97F)",
                                    }}
                                    disabled={!this.props.user}
                                    >
                                    Buy Now
                                    </Button>
                                </ListItem>
                                </>
                            : 
                                (!this.state.owned && !this.props.focus.hasRentPrice ?
                                    (<Divider className="sidebarDivider">
                                        Space Not Listed for Rent
                                    </Divider>) : null
                                )
                            }
                            {this.state.owned ? (
                                // <Box sx={{ display: 'flex', color: '#173A5E', bgcolor: 'black' }}>
                                <>
                                <Divider className="sidebarDivider">
                                    Modify Listing
                                </Divider>
                                <ListItem className="info" style={{ display: "block" }}>
                                    <Box className="infoHeader">PRICE</Box>
                                    <TextField
                                    hiddenLabel
                                    id="price-textfield"
                                    value={
                                        this.props.focus.rentPrice === null ? "" : this.props.focus.rentPrice
                                    }
                                    onChange={(e) => this.props.handleChangeFocusRentPrice(e)}
                                    style={{
                                        width: "100%",
                                        height: "30px",
                                    }}
                                    variant="filled"
                                    size="small"
                                    InputProps={{
                                        endAdornment: (
                                        <InputAdornment position="end">SOL</InputAdornment>
                                        ),
                                    }}
                                    />
                                    <Button
                                    size="small"
                                    variant="contained"
                                    onClick={() => {
                                        this.props.changeRentPrice();
                                    }}
                                    style={{
                                        width: "100%",
                                        marginTop: "20px",
                                        color: "#FFFFFF",
                                        background: "linear-gradient(to right bottom, #36EAEF7F, #6B0AC97F)",
                                    }}
                                    disabled={this.props.focus.price === null}
                                    >
                                    Set Price
                                    </Button>
                                    {this.props.focus.hasPrice ? (
                                    <Button
                                        size="small"
                                        variant="contained"
                                        onClick={() => {
                                        this.props.delistRent();
                                        }}
                                        style={{
                                        width: "100%",
                                        marginTop: "10px",
                                        color: "#FFFFFF",
                                        background: "linear-gradient(to right bottom, #36EAEF7F, #6B0AC97F)",
                                        }}
                                    >
                                        Delist
                                    </Button>
                                    ) : null}
                                </ListItem>
                                </>
                            ) : null}
                            </>
                        }
                    </TabPanel>
                  </div>            
        );
    }
}