export interface SessionConfig {
    endpoint: string;
    label: string;

}
export const StudySessionFactory = {
    allDue: (): SessionConfig => {
        return {
            endpoint: '/api/cards?due=true',
            label: 'All cards due',
        };
    },
    byCategory: (category: string): SessionConfig => {
        return {
            endpoint: `/api/cards?due=true&category=${category}`,
            label: `Due cards - ${category}`,
        };
    },
    fullCategory: (category: string): SessionConfig => {
        return {
            endpoint: `/api/cards?category=${category}`,
            label: `All cards - ${category}`,
        };
    }
}