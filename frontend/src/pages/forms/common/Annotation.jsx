import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalCloseButton,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    Box
} from '@chakra-ui/react'

function Annotation({ type, isOpen, onClose }) {
    const cppAnnotations = [
        {
            sign: '*',
            description:
                'All Own Energy Generation should be reported as Net Generation after deduction of auxiliary power consumption in the respective power plant.',
        },
        {
            sign: '**',
            description:
                'This is the total fossil based component of energy generation from CPP including generation from WHR.',
        },
        {
            sign: '***',
            description:
                'This is all Non-RE based energy generated from WHR, which is exempted from RCO obligation.',
        },
        {
            sign: '!!',
            description:
                'This is the total fossil based electricity generated through waste energy recovery from Industrial Processes.',
        },
        {
            sign: '!!!',
            description:
                'This value is only applicable in case of auxiliary firing of fossil based fuels in waste heat recovery boilers (WHRBs).',
        },
        {
            sign: '(1)',
            description:
                'This is the total fossil based component of electricity generation other than WHR and Waste Energy Recovery based power.',
        },
        {
            sign: '(2)',
            description:
                'This is the Co-generation component of balance fossil based electricity generation (excluding WHR and WER based power).',
        },
        {
            sign: '(3)',
            description:
                'Auxiliary Power Consumption will be apportioned in the same ratio as (Total generation - 50% Co-gen Power excluding WHR & WER - 100% WHR & WER Power) / (Total Generation).',
        },
        {
            sign: '(4)',
            description:
                'Drawl of electricity by the Designated Consumer as part of banking and / or storage transactions is considered as notional purchase of electricity.',
        },
        {
            sign: '(5)',
            description:
                'This includes Wind, Hydro, DRE and Other Renewable Energy components as per MoP Trajectory notification S.O. 4617(E) dtd. 20 October 2023.',
        },
        {
            sign: '(6)',
            description:
                'This is only that electricity which is requisitioned and purchased from the Discom as per Green Power Open Access Rules.',
        },
        {
            sign: 'ⴕ',
            description:
                'Definition of RE Sources (Wind, Hydro, DRE and Others) shall be as per MoP Trajectory notification S.O. 4617(E) dtd. 20 October 2023.',
        },
        {
            sign: 'ⴕⴕ',
            description:
                'This is the total non-fossil based component of energy generation from CPP applicable for renewable fuel combustion / co-firing.',
        },
        {
            sign: 'ⴕⴕⴕ',
            description:
                'Make an entry here only for the RECs purchased or self-retained during the target year compliance period (Quarter / Annual).',
        },
        {
            sign: '##',
            description:
                'Energy equivalent of GH2 and Green Ammonia Consumed should be evaluated as per Green Energy Open Access Rules with latest amendments.',
        },
        {
            sign: '###',
            description:
                'Make an entry here only for the RECs purchased or self-retained during the assessment year Compliance Window.',
        },
        {
            sign: '#',
            description:
                'RCO Compliance (Surplus / Deficit): Surplus is positive and Deficit is negative number.',
        },
    ];

    const discomAnnotations = [
        {
            sign: '(1)',
            description:
                'Please enter the amount of electrical energy procured from Wind Power Projects (WPPs) commissioned after March 31, 2024, under the "Wind RE" category. Any remaining wind energy procurement should be recorded under the "Other RE" category.',
        },
        {
            sign: '(2)',
            description:
                'Please enter the amount of electrical energy procured from Hydro (including PSP) and Small Hydro Power Projects commissioned after March 31, 2024, under the "Hydro" category. Any remaining hydro or small hydro energy procurement should be recorded under the "Other RE" category.',
        },
        {
            sign: '(3)',
            description:
                'For hilly and North-Eastern States/Union Territories (Arunachal Pradesh, Assam, Manipur, Meghalaya, Mizoram, Nagaland, Sikkim, Tripura, Jammu & Kashmir, Ladakh, Himachal Pradesh and Uttarakhand), the distributed renewable energy component shall be half of that given in the Table as per MoP Trajectory notification S.O. 4617(E) dtd. 20 October 2023.',
        },
        {
            sign: '(4)',
            description:
                'The distributed renewable energy component must be sourced exclusively from renewable electrical energy projects that do not exceed 10 MW in capacity. If generation data is unavailable, reported capacity will be converted into energy generation using a multiplier of 4 units per kilowatt per day (kWh/kW/day). Purchase or Sale of unmetered energy (DRE) is not the norm and is only made under "Own RE Generation".',
        },
        {
            sign: '(5)',
            description:
                'The other renewable energy component may be met by electrical energy produced from any renewable energy power project other than specified in Note 2, 3 and 4, and shall comprise electricity from all WPPs and Hydro Power Projects commissioned before 1st April, 2024. Other RE sourced exclusively from WPPs and HPPs shall be entered in respective rows under Other RE column.',
        },
        {
            sign: '(6)',
            description:
                'Please report the DRE generation based on meter reading at the generator meter. In case a direct meter reading is not available, then provision for such metering should be made within the next six months. Provisionally, energy generation may be reported as unmetered DRE generation using the multiplier of 4 kWh/kW/day.',
        },
        {
            sign: '(7)',
            description:
                'DRE purchased through bilateral PPAs may be entered here. Also, in case of DRE installations of Discom consumers connected in Net Metering or Gross Metering configurations, add: (i) Aggregation of all power generated from all grid connected DRE sources owned by Discom consumers who are not obligated under RCO, (ii) Aggregation of all power purchased from grid connected DRE sources owned by obligated Discom consumers.',
        },
        {
            sign: '(8)',
            description:
                'The electricity received into the Grid by the Discom for banking and / or storage transaction is considered as notional purchase of electricity and added into total electricity consumption for RCO Calculations; Whereas the electricity supplied from the Grid is considered as notional sale and deducted from total electricity consumption.',
        },
        {
            sign: '***',
            description:
                'All electricity purchase and sales shall be considered at Discom periphery, i.e. after deducting Transmission losses upto Discom periphery. This deduction includes all ISTS losses and applicable STU losses occurring outside discom periphery.',
        },
        {
            sign: '$$',
            description:
                'RCO is applicable on Distribution losses occurring within Discom periphery. The distribution losses are to be calculated in Million kWh and reported as a percentage share of total electrical energy consumed. Distribution losses (% share) are reported for information and are not used in calculations.',
        },
        {
            sign: 'ⴕⴕ',
            description:
                'RE Source wise details (Wind, Hydro, DRE and Others) to be filled mandatorily by Distribution Licensees. All RE Generation should be reported as Net Generation after deduction of auxiliary power consumption. SLDC to review the auxiliary power consumption records and confirm prior to endorsing the Form A.',
        },
        {
            sign: 'ⴕⴕⴕ',
            description:
                'RE Source wise details (Wind, Hydro, DRE and Others) may be filled by Distribution Licensees if available. In case source wise breakup of RE sales is not available, sales data may be entered under other RE. RE sold to Discom consumers against requisition as per Green Energy Open Access Rules will also be recorded.',
        },
        {
            sign: '!!',
            description:
                'Make an entry here only for the RECs purchased or self-retained during the applicable compliance period (quarter/annual) of the Target Year. Please attach the corresponding Certificate(s) of Purchase covering all the RECs purchased and self-retained.',
        },
        {
            sign: '!!!',
            description:
                'Make an entry here only for the RECs purchased or self-retained during the Assessment Year Compliance Window. Please attach the corresponding Certificate(s) of Purchase covering all the RECs purchased and self-retained.',
        },
        {
            sign: '###',
            description:
                'Renewable Consumption Obligations (%Targets) notified by MoP will be auto-populated once the Target Year (i.e. the financial year for which RCO Compliance is being evaluated) and Location (State) of the Designated Consumer is entered.',
        },
        {
            sign: '#',
            description:
                'RCO Compliance (Surplus / Deficit): Surplus is positive and Deficit is negative number.',
        },
    ];

    // choose annotations based on type prop ("DISCOM" => discomAnnotations, "INDUSTRY" => cppAnnotations)
    const mode = (type || 'INDUSTRY').toUpperCase();
    const annotations = mode === 'DISCOM' ? discomAnnotations : cppAnnotations;

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
            <ModalOverlay />
            <ModalContent maxW="900px">
                <ModalHeader fontSize="lg" fontWeight="bold">
                    Form Annotations & Footnotes
                </ModalHeader>
                <ModalCloseButton />
                <ModalBody pb={6}>
                    <Box overflowX="auto">
                        <Table variant="striped" colorScheme="gray" size="sm">
                            <Thead bg="gray.100">
                                <Tr>
                                    <Th width="100px" textAlign="center">
                                        Sign
                                    </Th>
                                    <Th>Description</Th>
                                </Tr>
                            </Thead>
                            <Tbody>
                                {annotations.map((annotation, index) => (
                                    <Tr key={index}>
                                        <Td fontWeight="bold" textAlign="center" bg="gray.50">
                                            {annotation.sign}
                                        </Td>
                                        <Td fontSize="sm" lineHeight="1.6">
                                            {annotation.description}
                                        </Td>
                                    </Tr>
                                ))}
                            </Tbody>
                        </Table>
                    </Box>
                </ModalBody>
            </ModalContent>
        </Modal>
    )
}

export default Annotation