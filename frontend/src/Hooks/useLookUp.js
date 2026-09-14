import { useSelector } from "react-redux";
import { useMemo } from "react";

export const useStateName = () => {
    const { states } = useSelector(state => state.commonState);

    const stateMap = useMemo(() => {
        const map = {};
        states?.forEach(s => {
            map[s.state_code] = s.state_name;
        });
        return map;
    }, [states]);
    return (code) => stateMap[code] || code;
};

export const useSectorName = () => {
    const { sectorTypes } = useSelector(state => state.commonState);

    const sectorMap = useMemo(() => {
        const map = {};
        sectorTypes?.forEach(s => {
            map[s.sector_code] = s.sector_name;
        });
        return map;
    }, [sectorTypes]);
    return (code) => sectorMap[code] || code;
}

export const useFY = () => {
    const { financialYears } = useSelector(state => state.commonState);
    const fyMap = useMemo(() => {
        const map = {};
        financialYears?.forEach(f => {
            map[f.id] = f.fy_code;
        });
        return map;
    }, [financialYears]);

    return (fy_id) => {
        if (fy_id === undefined || fy_id === null || fy_id === '') return '';
        return fyMap[fy_id] ?? fyMap[Number(fy_id)] ?? '';
    };
}

export const usePeriodCode = () => {
    const { submissionPeriods } = useSelector(state => state.commonState);

    const periodMap = useMemo(() => {
        const map = {};
        submissionPeriods?.forEach(p => {
            map[p.id] = p.period_code;
        });
        return map;
    }, [submissionPeriods]);

    return (period_id) => {
        if (period_id === undefined || period_id === null || period_id === '') return '';
        return periodMap[period_id] ?? periodMap[Number(period_id)] ?? '';
    };
}