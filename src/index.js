'use strict';

import React from "react";
import ReactDOM from 'react-dom';
import axios from 'axios';
import {Accordion,Panel,Navbar,Nav,NavItem,Button,Grid,Row,Col,ControlLabel,FormControl,FormGroup,Form,Modal,OverlayTrigger,Popover,Tabs,Tab,Tooltip} from 'react-bootstrap';


// pull in the ag-grid styles we're interested in
import "ag-grid-root/dist/styles/ag-grid.css";
import "ag-grid-root/dist/styles/theme-fresh.css";

// our application
import PlayerGrid from "./PlayerGrid";

class App extends React.Component {
  constructor() {
    super();
    this.leagueSettings = localStorage.getItem('leagueSettings');
    if(!this.leagueSettings) {
      this.leagueSettings = {
          "num_teams": 12,
          "team_budget": 200,
          "flex_type": "rb/wr/te",
          "starter_budget_pct": 0.88,
          "override_bench_allocation": {},
          "roster": {
              "qb": 1,
              "rb": 2,
              "wr": 2,
              "te": 1,
              "flex": 1,
              "team_def": 1,
              "k": 1,
              "bench": 6
          },
          "scoring": {
              "passAtt": 0,
              "passComp": 0,
              "passYds": 25,
              "passTds": 4,
              "twoPts": 2,
              "sacks": 0,
              "passInt": -1,
              "rushAtt": 0,
              "rushYds": 10,
              "rushTds": 6,
              "rec": 0,
              "recYds": 10,
              "recTds": 6,
              "fumbles": -2
          }
      };
    }
    else this.leagueSettings = JSON.parse(this.leagueSettings);

    if(!this.teamList) {
      this.teamList = [];
      for(var i = 0; i < this.leagueSettings.num_teams; i++) {
        this.teamList.push("Team #" + (i + 1));
      }
    }

    let startingBudget = ((this.leagueSettings.num_teams * this.leagueSettings.team_budget)
      - (this.leagueSettings.roster.k * this.leagueSettings.num_teams
          + this.leagueSettings.roster.team_def * this.leagueSettings.num_teams));
    this.state = {
      startingBudget: startingBudget,
      remainingBudget: startingBudget,
      inflationRate: 1,
      rowData: [],
      showModal: false,
      leagueSettings: this.leagueSettings,
      teamList: this.teamList,
    };

    this.onPlayerDataChange = this.onPlayerDataChange.bind(this);
    this.onTeamNameChange = this.onTeamNameChange.bind(this);
    this.getTeamRow = this.getTeamRow.bind(this);
    this.getTeamRows = this.getTeamRows.bind(this);
    this.close = this.close.bind(this);
    this.open = this.open.bind(this);
    this.onSettingsChange = this.onSettingsChange.bind(this);
    this.saveSettings = this.saveSettings.bind(this);
    this.saveSettings();
  }

  onPlayerDataChange() {
    console.log("Recalculating inflation");
    let inflationData = calcInflation(this.state.rowData, this.state.startingBudget, this.state.teamList);
    this.setState({
      rowData: inflationData['players'],
      remainingBudget: this.state.startingBudget - inflationData['usedBudget'],
      inflationRate: inflationData['inflationRate'],
      myRemainingBudget: this.leagueSettings.team_budget - inflationData['mySpentBudget'],
    });
  }

  getInitialState() {
    return { showModal: false };
  }

  saveSettings() {
    let startingBudget = ((this.leagueSettings.num_teams * this.leagueSettings.team_budget)
      - (this.leagueSettings.roster.k * this.leagueSettings.num_teams
          + this.leagueSettings.roster.team_def * this.leagueSettings.num_teams));

    var num_teams_change = this.leagueSettings.num_teams - this.state.teamList.length;
    if(num_teams_change > 0) {
      for(var i = 0; i < num_teams_change; i++) {
        this.state.teamList.push("");
      }
    }
    else if(num_teams_change < 0) {
      for(var i = num_teams_change; i < 0; i++) {
        this.state.teamList.pop();
      }
    }
    this.setState({
      showModal: false,
      startingBudget: startingBudget,
      teamList: this.state.teamList,
    });
    axios.post(`http://localhost:5000/players`, this.leagueSettings)
    .then(res => {
      let inflationData = calcInflation(mergeSavedData(res.data), this.state.startingBudget, this.state.teamList);
      this.setState({
        startingBudget: this.state.startingBudget,
        rowData: inflationData['players'],
        remainingBudget: this.state.startingBudget - inflationData['usedBudget'],
        inflationRate: inflationData['inflationRate'],
        myRemainingBudget: this.leagueSettings.team_budget - inflationData['mySpentBudget'],
      });
    });
    localStorage.setItem('leagueSettings', JSON.stringify(this.leagueSettings));
  }

  close() {
    this.setState({ showModal: false });
  }

  open() {
    this.setState({ showModal: true });
  }

  formatInflationRate(rate) {
    return (rate*100).toFixed(2) + "%";
  }

  onSettingsChange(e) {
    if(e.target.id == 'num_teams') this.leagueSettings.num_teams = parseInt(e.target.value);
    if(e.target.id == 'team_budget') this.leagueSettings.team_budget = parseInt(e.target.value);
    if(e.target.id == 'starter_budget_pct') this.leagueSettings.starter_budget_pct = parseFloat(e.target.value);
    if(e.target.id == 'roster[qb]') this.leagueSettings.roster.qb = parseInt(e.target.value);
    if(e.target.id == 'roster[rb]') this.leagueSettings.roster.rb = parseInt(e.target.value);
    if(e.target.id == 'roster[wr]') this.leagueSettings.roster.wr = parseInt(e.target.value);
    if(e.target.id == 'roster[te]') this.leagueSettings.roster.te = parseInt(e.target.value);
    if(e.target.id == 'roster[flex]') this.leagueSettings.roster.flex = parseInt(e.target.value);
    if(e.target.id == 'roster[k]') this.leagueSettings.roster.k = parseInt(e.target.value);
    if(e.target.id == 'roster[team_def]') this.leagueSettings.roster.team_def = parseInt(e.target.value);
    if(e.target.id == 'roster[bench]') this.leagueSettings.roster.bench = parseInt(e.target.value);
    if(e.target.id == 'scoring[passYds]') this.leagueSettings.scoring.passYds = parseInt(e.target.value);
    if(e.target.id == 'scoring[passComp]') this.leagueSettings.scoring.passComp = parseFloat(e.target.value);
    if(e.target.id == 'scoring[sacks]') this.leagueSettings.scoring.sacks = parseFloat(e.target.value);
    if(e.target.id == 'scoring[passInt]') this.leagueSettings.scoring.passInt = parseFloat(e.target.value);
    if(e.target.id == 'scoring[rushYds]') this.leagueSettings.scoring.rushYds = parseInt(e.target.value);
    if(e.target.id == 'scoring[rushTds]') this.leagueSettings.scoring.rushTds = parseInt(e.target.value);
    if(e.target.id == 'scoring[rushAtt]') this.leagueSettings.scoring.rushAtt = parseFloat(e.target.value);
    if(e.target.id == 'scoring[fumbles]') this.leagueSettings.scoring.fumbles = parseFloat(e.target.value);
    if(e.target.id == 'scoring[recYds]') this.leagueSettings.scoring.recYds = parseInt(e.target.value);
    if(e.target.id == 'scoring[recTds]') this.leagueSettings.scoring.recTds = parseFloat(e.target.value);
    if(e.target.id == 'scoring[rec]') this.leagueSettings.scoring.rec = parseFloat(e.target.value);
    if(e.target.id == 'scoring[twoPts]') this.leagueSettings.scoring.twoPts = parseFloat(e.target.value);
    this.setState({
      leagueSettings: this.leagueSettings
    });
  }

  getTeamRow(i) {
    var teamControlId = "team." + i;
    var yourTeamNote = ""
    if(i == 0) yourTeamNote = <i>(your team)</i>;
    return <Row style={{"padding-bottom": "5px"}}>
      <FormGroup controlId={teamControlId}>
        <Col md={3}>
          <ControlLabel >Team #{i+1}</ControlLabel> {' '}{yourTeamNote}
        </Col>
        <Col md={4}>
          <FormControl type="text" placeholder="Team name..." value={this.state.teamList[i]} onChange={this.onTeamNameChange}/>
        </Col>
        </FormGroup>
    </Row>;
  }

  getTeamRows(num_teams) {
    let teamListComponents = [];

    for(var i=0; i < this.leagueSettings.num_teams; i++) {
      teamListComponents.push(this.getTeamRow(i));
    }
    return teamListComponents;
  }

  onTeamNameChange(e) {
    var teamId = parseInt(e.target.id.replace("team.",""));
    this.state.teamList[teamId] = e.target.value;
    this.setState({
      teamList: this.state.teamList,
    });
  }


  render() {
    const popover = (
      <Popover id="modal-popover" title="popover">
        very popover. such engagement
      </Popover>
    );
    const tooltip = (
      <Tooltip id="modal-tooltip">
        wow.
      </Tooltip>
    );
    let tabPadding = {
        "padding-top": "2rem",
    };

    let teamListComponents = [];
    return (
        <Grid>
          <Navbar inverse>
            <Navbar.Header>
              <Navbar.Brand>
                <a href="#">FFAuction</a>
              </Navbar.Brand>
            </Navbar.Header>
            <Nav>
              <NavItem eventKey={1} href="#" onClick={this.open}>Configure</NavItem>
            </Nav>
          </Navbar>
          <Row>
            <Col md={12}>
              <h1>Draft board</h1>
            </Col>
          </Row>
          <Accordion defaultActiveKey="1">
            <Panel header="Draft details" eventKey="1">
            <Row>
              <Col md={3}>
              My remaining budget: <b>${this.state.myRemainingBudget}</b>
              </Col>
              <Col md={3}>
              Total remaining budget: <b>${this.state.remainingBudget}</b>
              </Col>
              <Col md={3}>
              Inflation rate: <b>{this.formatInflationRate(this.state.inflationRate)}</b>
              </Col>
            </Row>
            </Panel>
          </Accordion>

          <Modal show={this.state.showModal} onHide={this.close}>
          <Modal.Header closeButton>
            <Modal.Title>League settings</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
                <Tabs defaultActiveKey={1}>
                <Tab eventKey={1} title="Auction settings" style={tabPadding}>
                  <Row>
                    <Col xs={2}>
                      <FormGroup controlId="num_teams">
                        <ControlLabel >Teams</ControlLabel>
                        <FormControl type="number" placeholder="12" value={this.state.leagueSettings.num_teams} onChange={this.onSettingsChange}/>
                      </FormGroup>
                    </Col>
                    <Col xs={2}>
                      <FormGroup controlId="team_budget">
                        <ControlLabel >Budget</ControlLabel>
                        <FormControl type="number" placeholder="200" value={this.state.leagueSettings.team_budget} onChange={this.onSettingsChange}/>
                      </FormGroup>
                    </Col>
                    <Col xs={2}>
                      <FormGroup controlId="starter_budget_pct">
                        <ControlLabel >Starter Budget %</ControlLabel>
                        <FormControl type="number" placeholder=".88" step="0.01" value={this.state.leagueSettings.starter_budget_pct} onChange={this.onSettingsChange} />
                      </FormGroup>
                    </Col>
                  </Row>
                </Tab>
                <Tab eventKey={2} title="Roster settings" style={tabPadding}>
                <Row>
                  <Col xs={2}>
                    <FormGroup controlId="roster[qb]">
                      <ControlLabel >QBs</ControlLabel>
                      <FormControl type="number" placeholder="1" value={this.state.leagueSettings.roster.qb} onChange={this.onSettingsChange}/>
                    </FormGroup>
                  </Col>
                  <Col xs={2}>
                    <FormGroup controlId="roster[rb]">
                      <ControlLabel >RBs</ControlLabel>
                      <FormControl type="number" placeholder="2" value={this.state.leagueSettings.roster.rb} onChange={this.onSettingsChange}/>
                    </FormGroup>
                  </Col>
                  <Col xs={2}>
                    <FormGroup controlId="roster[wr]">
                      <ControlLabel >WRs</ControlLabel>
                      <FormControl type="number" placeholder="2" value={this.state.leagueSettings.roster.wr} onChange={this.onSettingsChange}/>
                    </FormGroup>
                  </Col>
                  <Col xs={2}>
                    <FormGroup controlId="roster[te]">
                      <ControlLabel >TEs</ControlLabel>
                      <FormControl type="number" placeholder="1" value={this.state.leagueSettings.roster.te} onChange={this.onSettingsChange}/>
                    </FormGroup>
                  </Col>
                  <Col xs={2}>
                    <FormGroup controlId="roster[flex]">
                      <ControlLabel >Flex</ControlLabel>
                      <FormControl type="number" placeholder="1" value={this.state.leagueSettings.roster.flex} onChange={this.onSettingsChange}/>
                    </FormGroup>
                  </Col>
                  </Row>
                  <Row>
                  <Col xs={2}>
                    <FormGroup controlId="roster[k]">
                      <ControlLabel >Kickers</ControlLabel>
                      <FormControl type="number" placeholder="1" value={this.state.leagueSettings.roster.k} onChange={this.onSettingsChange}/>
                    </FormGroup>
                  </Col>
                  <Col xs={2}>
                    <FormGroup controlId="roster[team_def]">
                      <ControlLabel >Def</ControlLabel>
                      <FormControl type="number" placeholder="1" value={this.state.leagueSettings.roster.team_def} onChange={this.onSettingsChange}/>
                    </FormGroup>
                  </Col>
                  <Col xs={2}>
                    <FormGroup controlId="roster[bench]">
                      <ControlLabel >Bench</ControlLabel>
                      <FormControl type="number" placeholder="6" value={this.state.leagueSettings.roster.bench} onChange={this.onSettingsChange}/>
                    </FormGroup>
                  </Col>
                </Row>
                </Tab>
                <Tab eventKey={3} title="Scoring settings" style={tabPadding}>
                <h4>Passing</h4>
                <Row>
                  <Col xs={2}>
                    <FormGroup controlId="scoring[passYds]">
                      <ControlLabel >Yards/point</ControlLabel>
                      <FormControl type="number" placeholder="25" value={this.state.leagueSettings.scoring.passYds} onChange={this.onSettingsChange}/>
                    </FormGroup>
                  </Col>
                  <Col xs={2}>
                    <FormGroup controlId="scoring[passTds]">
                      <ControlLabel >TDs</ControlLabel>
                      <FormControl type="number" placeholder="4" value={this.state.leagueSettings.scoring.passTds} onChange={this.onSettingsChange}/>
                    </FormGroup>
                  </Col>
                  <Col xs={2}>
                    <FormGroup controlId="scoring[passComp]">
                      <ControlLabel >Completions</ControlLabel>
                      <FormControl type="number" placeholder="0" value={this.state.leagueSettings.scoring.passComp} onChange={this.onSettingsChange}/>
                    </FormGroup>
                  </Col>
                   <Col xs={2}>
                    <FormGroup controlId="scoring[sacks]">
                      <ControlLabel >Sacks</ControlLabel>
                      <FormControl type="number" placeholder="0" step="0.5" value={this.state.leagueSettings.scoring.sacks} onChange={this.onSettingsChange}/>
                    </FormGroup>
                  </Col>
                   <Col xs={2}>
                    <FormGroup controlId="scoring[passInt]">
                      <ControlLabel >Pass Ints</ControlLabel>
                      <FormControl type="number" placeholder="-1" step="0.5" value={this.state.leagueSettings.scoring.passInt} onChange={this.onSettingsChange}/>
                    </FormGroup>
                  </Col>
                </Row>
                <h4>Rushing</h4>
                <Row>
                  <Col xs={2}>
                    <FormGroup controlId="scoring[rushYds]">
                      <ControlLabel >Yards/point</ControlLabel>
                      <FormControl type="number" placeholder="10" value={this.state.leagueSettings.scoring.rushYds} onChange={this.onSettingsChange}/>
                    </FormGroup>
                  </Col>
                  <Col xs={2}>
                    <FormGroup controlId="scoring[rushTds]">
                      <ControlLabel >TDs</ControlLabel>
                      <FormControl type="number" placeholder="6" value={this.state.leagueSettings.scoring.rushTds} onChange={this.onSettingsChange}/>
                    </FormGroup>
                  </Col>
                  <Col xs={2}>
                    <FormGroup controlId="scoring[rushAtt]">
                      <ControlLabel >Attempts</ControlLabel>
                      <FormControl type="number" placeholder="0" value={this.state.leagueSettings.scoring.rushAtt} onChange={this.onSettingsChange}/>
                    </FormGroup>
                  </Col>
                  <Col xs={2}>
                    <FormGroup controlId="scoring[fumbles]">
                      <ControlLabel >Fumbles</ControlLabel>
                      <FormControl type="number" placeholder="-2" step="0.5" value={this.state.leagueSettings.scoring.fumbles} onChange={this.onSettingsChange}/>
                    </FormGroup>
                  </Col>
                </Row>
                <h4>Receiving</h4>
                <Row>
                  <Col xs={2}>
                    <FormGroup controlId="scoring[recYds]">
                      <ControlLabel >Yards/point</ControlLabel>
                      <FormControl type="number" placeholder="10" value={this.state.leagueSettings.scoring.recYds} onChange={this.onSettingsChange}/>
                    </FormGroup>
                  </Col>
                  <Col xs={2}>
                    <FormGroup controlId="scoring[recTds]">
                      <ControlLabel >TDs</ControlLabel>
                      <FormControl type="number" placeholder="6" value={this.state.leagueSettings.scoring.recTds} onChange={this.onSettingsChange}/>
                    </FormGroup>
                  </Col>
                  <Col xs={2}>
                    <FormGroup controlId="scoring[rec]">
                      <ControlLabel >Receptions</ControlLabel>
                      <FormControl type="number" placeholder="0" step="0.5" value={this.state.leagueSettings.scoring.rec} onChange={this.onSettingsChange}/>
                    </FormGroup>
                  </Col>
                </Row>
                <h4>Other</h4>
                <Row>
                  <Col xs={2}>
                    <FormGroup controlId="scoring[twoPts]">
                      <ControlLabel >2pts</ControlLabel>
                      <FormControl type="number" placeholder="2" value={this.state.leagueSettings.scoring.twoPts} onChange={this.onSettingsChange}/>
                    </FormGroup>
                  </Col>
                </Row>
                </Tab>
                <Tab eventKey={4} title="Teams" style={tabPadding}>
                  <h4>Team list</h4>
                  {this.getTeamRows(this.state.leagueSettings.num_teams)}
                </Tab>
                </Tabs>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button onClick={this.saveSettings}>Save and update prices</Button>
          </Modal.Footer>
        </Modal>
        <Row>
        <Col md={12}>
        <PlayerGrid
          rowData={this.state.rowData}
          teamList={this.state.teamList}
          onPlayerDataChange={this.onPlayerDataChange}>
        </PlayerGrid>
        </Col>
        </Row>
        </Grid>
    );
  }
}

ReactDOM.render(<App />, document.getElementById("app"));

function calcInflation(players, startingBudget, teamList) {
  let accumulatedValue = 0;
  let usedBudget = 0;
  let mySpentBudget = 0;
  players.forEach((player) => {
    if(player.hasOwnProperty('purchase_price') && !isNaN(player.purchase_price) && player.purchase_price !== null) {
      accumulatedValue += player.base_price - player.purchase_price;
      usedBudget += player.purchase_price;
      // @TODO some other way to set a team as "yours"?
      if(teamList && player.draft_team == teamList[0]) {
        mySpentBudget += player.purchase_price;
      }
    }
  });
  let inflationRate = (startingBudget + accumulatedValue) / startingBudget
  players.forEach((player) => {
    player.inflated_price = inflationRate * player.base_price;
  });
  return {"players": players, "usedBudget": usedBudget, "inflationRate": inflationRate, "mySpentBudget": mySpentBudget};
}

function mergeSavedData(players) {
  players.forEach((player) => {
    let savedPlayerData = localStorage.getItem("player-" + player.player_id);
    if(savedPlayerData) {
      savedPlayerData = JSON.parse(savedPlayerData);
      player.purchase_price = savedPlayerData.purchase_price;
      player.draft_team = savedPlayerData.draft_team;
    }
  });
  return players;
}
