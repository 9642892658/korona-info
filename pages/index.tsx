
import { NextPage } from 'next';
import Head from 'next/head';
import fetch from 'isomorphic-unfetch';
import { format } from 'date-fns';
import { Area, AreaChart, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, BarChart, Bar, Cell, LabelList,} from 'recharts';
import { Flex, Box, PseudoBox } from '@chakra-ui/core';

import Layout from '../components/Layout';
import StatBlock from '../components/StatBlock';
import Block from '../components/Block';
import Copyright from '../components/Copyright';
import Header from '../components/Header';
import { getTimeSeriesData, getTnfectionsByDistrict, getTnfectionsBySourceCountry } from '../utils/chartDataHelper';

export interface KoronaData {
  confirmed: Confirmed[];
  deaths: any[];
}

export interface Confirmed {
  id: string;
  date: Date;
  healthCareDistrict: string;
  infectionSource: InfectionSourceEnum | number;
}

export enum InfectionSourceEnum {
  RelatedToEarlier = "related to earlier",
  Unknown = "unknown",
}

const colors = [
  '#003f5c',
  '#2fab8e',
  '#665191',
  '#a05195',
  '#d45087',
  '#f95d6a',
  '#ff7c43',
  '#ffa600',
  '#ee2320',
];

const CustomizedAxisTick: React.FC<any> = (props) => {
  const {
    x, y, stroke, payload, isDate
  } = props;
  
  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={0} dy={14} fontSize={12} textAnchor="end" fill="#666" transform="rotate(-35)">{isDate ? format(new Date(payload.value), 'd.M.') : payload.value}</text>
    </g>
  );
}

const Index: NextPage<KoronaData> = ({ confirmed, deaths }) => {

  // Map some data for stats blocks
  const latestInfection = format(new Date(confirmed[confirmed.length - 1].date), 'd.M.yyyy');
  const latestInfectionDistrict = confirmed[confirmed.length - 1].healthCareDistrict;
  const latestDeath = deaths.length ? format(new Date(deaths[deaths.length - 1].date), 'd.M.yyyy') : null;
  const latestDeathDistrict = deaths.length ? deaths[deaths.length - 1].healthCareDistrict : null;

  // Map data to show development of infections
  const { infectionDevelopmentData, infectionDevelopmentData30Days } = getTimeSeriesData(confirmed);
  const { infectionsByDistrict, areas } = getTnfectionsByDistrict(confirmed);
  const { infectionsBySourceCountry } = getTnfectionsBySourceCountry(confirmed);

  return (
    <Layout>
      <Head>
        <title>🦠 Suomen koronavirus-tartuntatilanne – tartunnat: {confirmed.length} - kuolemat: {deaths.length || 0}</title>
        <meta name="description" content={`Suomen koronavirus-tartuntatilanne – tartunnat: ${confirmed.length} - kuolemat: ${deaths.length || 0}`} /> 
        <meta property="og:title" content={`Suomen koronavirus-tartuntatilanne`} />
        <meta property="og:description" content={`Tartuntoja tällä hetkellä: ${confirmed.length} - menehtyneitä: ${deaths.length || 0}`} />
        <meta property="og:site_name" content="Suomen koronavirus-tartuntatilanne" />
        <meta property="og:locale" content="fi_FI" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://korona.kans.io" />
      </Head>
      <Flex alignItems="center" flexDirection="column" flex="1" width={"100%"} maxWidth="1440px" margin="auto">
        <Header />
        <Flex flexWrap="wrap" flexDirection="row" justifyContent="center" alignItems="stretch" flex="1" width={"100%"}>
          <Box width={['100%', '100%', 1/2]} p={5}>
            <Block title="Tartunnat" footer={`Viimeisin tartunta ${latestInfection} (${latestInfectionDistrict})`}>
              <StatBlock count={confirmed.length} />
            </Block>
          </Box>
          <Box width={['100%', '100%', 1/2]} p={5}>
            <Block title="Menehtyneet" footer={latestDeath ? `Viimeisin kuolema ${latestDeath} (${latestDeathDistrict})` : ' '}>
              <StatBlock count={deaths.length || 0} />
            </Block>
          </Box>
          <Box width={['100%']} p={5}>
            <Block title="Tartuntojen lukumäärä (kumulatiivinen)" footer="Tartuntojen kumulatiivinen kehitys viimeisen 30 päivän aikana">
              <ResponsiveContainer width={'100%'} height={350}>
                <AreaChart
                  data={infectionDevelopmentData30Days}
                  margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
                >
                  <defs>
                    <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#fbdd74" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#fbdd74" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorPv" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={colors[6]} stopOpacity={0.8}/>
                      <stop offset="95%" stopColor={colors[6]} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis tickFormatter={d => format(new Date(d), 'd.M.')} tick={<CustomizedAxisTick isDate />} dataKey="date" domain={['dataMin', 'dataMax']} type="number" scale="time" />
                  <YAxis unit=" kpl" tick={{fontSize: 12}} name="Tartunnat" tickCount={Math.round(infectionDevelopmentData30Days[infectionDevelopmentData30Days.length - 1].infections / 4)} />
                  <CartesianGrid opacity={0.2} />
                  <Tooltip formatter={(value, name) => [value, 'Tartunnat']} labelFormatter={v => format(new Date(v), 'dd.MM.yyyy')} />
                  <Area type="monotone" dataKey="infections" stroke={colors[6]} fillOpacity={1} fill="url(#colorPv)" />
                </AreaChart>
              </ResponsiveContainer>
            </Block>
          </Box>
          <Box width={['100%', '100%', 1/2]} p={5}>
            <Block title="Tartunnat sairaanhoitopiireittäin" footer="Helsingin ja Uudenmaan sairaanhoitopiiri on esitetty muodossa HUS">
              <ResponsiveContainer width={'100%'} height={350}>
                <BarChart
                  data={infectionsByDistrict}
                  margin={{
                    top: 20, right: 30, left: 0, bottom: 85,
                  }}
                >
                  <XAxis interval={0} dataKey="name" tick={<CustomizedAxisTick />} />
                  <YAxis unit=" kpl" dataKey="infections" tick={{fontSize: 12}} />
                  <Tooltip formatter={(value, name) => [value, 'Tartunnat']} />
                    <Bar dataKey="infections">
                    {
                      areas.map((area, index) => (
                        <Cell key={area} fill={colors[index % colors.length]} />
                      ))
                    }
                    <LabelList dataKey="infections" position="top" formatter={(e) => e}/>
                    </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Block>
          </Box>
          <Box width={['100%', '100%', 1/2]} p={5}>
            <Block title="Tartuntojen alkuperämaat" footer="Suomen tartuntojen lukumäärät alkuperämaittain">
              <ResponsiveContainer width={'100%'} height={350}>
                <BarChart
                  data={infectionsBySourceCountry}
                  margin={{
                    top: 20, right: 30, left: 0, bottom: 85,
                  }}
                >
                  <XAxis interval={0} dataKey="name" tick={<CustomizedAxisTick />} />
                  <YAxis unit=" kpl" dataKey="infections" tick={{fontSize: 12}} />
                  <Tooltip formatter={(value, name) => [value, 'Tartunnat']} />
                    <Bar dataKey="infections">
                    {
                      areas.map((area, index) => (
                        <Cell key={area} fill={colors[index % colors.length]} />
                      ))
                    }
                    <LabelList dataKey="infections" position="top" />
                    </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Block>
          </Box>
        </Flex>

        <Copyright />
      </Flex>
    </Layout>
  );
}

Index.getInitialProps = async function () {
  const res = await fetch('https://w3qa5ydb4l.execute-api.eu-west-1.amazonaws.com/prod/finnishCoronaData');
  const data = await res.json();

  return data;
};

export default Index;