import { type User, type InsertUser, type Company, type InsertCompany, type FinancialData, type InsertFinancialData } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Companies
  getCompaniesByUserId(userId: string): Promise<Company[]>;
  getCompany(id: string): Promise<Company | undefined>;
  createCompany(company: InsertCompany): Promise<Company>;
  
  // Financial Data
  getFinancialData(companyId: string, period?: string): Promise<FinancialData[]>;
  getFinancialDataByPeriod(companyId: string, period: string): Promise<FinancialData | undefined>;
  createOrUpdateFinancialData(data: InsertFinancialData): Promise<FinancialData>;
  getFinancialDataRange(companyId: string, startPeriod: string, endPeriod: string): Promise<FinancialData[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private companies: Map<string, Company>;
  private financialData: Map<string, FinancialData>;

  constructor() {
    this.users = new Map();
    this.companies = new Map();
    this.financialData = new Map();
    
    // Initialize with sample data for demo
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Create sample user
    const userId = randomUUID();
    const user: User = {
      id: userId,
      username: "demo@company.com",
      password: "password123"
    };
    this.users.set(userId, user);

    // Create sample company
    const companyId = randomUUID();
    const company: Company = {
      id: companyId,
      name: "Demo Company",
      userId: userId,
      createdAt: new Date()
    };
    this.companies.set(companyId, company);

    // Create sample financial data for current and previous periods
    const currentPeriod = "2024";
    const previousPeriod = "2023";
    
    const currentData: FinancialData = {
      id: randomUUID(),
      companyId,
      period: currentPeriod,
      periodType: "yearly",
      totalRevenue: "2847500.00",
      grossProfit: "1210187.50",
      netIncome: "521092.50",
      operatingIncome: "575000.00",
      costOfGoodsSold: "1637312.50",
      operatingExpenses: "635187.50",
      totalAssets: "4100000.00",
      currentAssets: "1250000.00",
      inventory: "180000.00",
      accountsReceivable: "328000.00",
      totalLiabilities: "2980000.00",
      currentLiabilities: "595000.00",
      accountsPayable: "230000.00",
      totalEquity: "2120000.00",
      operatingCashFlow: "425800.00",
      investingCashFlow: "-150000.00",
      financingCashFlow: "-80000.00",
      marketingSpend: "145000.00",
      newCustomers: 508,
      totalCustomers: 2850,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const previousData: FinancialData = {
      id: randomUUID(),
      companyId,
      period: previousPeriod,
      periodType: "yearly",
      totalRevenue: "2531250.00",
      grossProfit: "1030406.25",
      netIncome: "412062.50",
      operatingIncome: "485000.00",
      costOfGoodsSold: "1500843.75",
      operatingExpenses: "545406.25",
      totalAssets: "3800000.00",
      currentAssets: "1100000.00",
      inventory: "165000.00",
      accountsReceivable: "295000.00",
      totalLiabilities: "2650000.00",
      currentLiabilities: "578947.37",
      accountsPayable: "215000.00",
      totalEquity: "1850000.00",
      operatingCashFlow: "392000.00",
      investingCashFlow: "-125000.00",
      financingCashFlow: "-70000.00",
      marketingSpend: "135000.00",
      newCustomers: 430,
      totalCustomers: "2342".length > 0 ? 2342 : 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.financialData.set(currentData.id, currentData);
    this.financialData.set(previousData.id, previousData);
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getCompaniesByUserId(userId: string): Promise<Company[]> {
    return Array.from(this.companies.values()).filter(
      (company) => company.userId === userId
    );
  }

  async getCompany(id: string): Promise<Company | undefined> {
    return this.companies.get(id);
  }

  async createCompany(insertCompany: InsertCompany): Promise<Company> {
    const id = randomUUID();
    const company: Company = { ...insertCompany, id, createdAt: new Date() };
    this.companies.set(id, company);
    return company;
  }

  async getFinancialData(companyId: string, period?: string): Promise<FinancialData[]> {
    const allData = Array.from(this.financialData.values()).filter(
      (data) => data.companyId === companyId
    );
    
    if (period) {
      return allData.filter(data => data.period === period);
    }
    
    return allData.sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async getFinancialDataByPeriod(companyId: string, period: string): Promise<FinancialData | undefined> {
    return Array.from(this.financialData.values()).find(
      (data) => data.companyId === companyId && data.period === period
    );
  }

  async createOrUpdateFinancialData(data: InsertFinancialData): Promise<FinancialData> {
    // Check if data for this company and period already exists
    const existing = await this.getFinancialDataByPeriod(data.companyId, data.period);
    
    if (existing) {
      // Update existing record
      const updated: FinancialData = { 
        ...existing, 
        ...data, 
        updatedAt: new Date() 
      };
      this.financialData.set(existing.id, updated);
      return updated;
    } else {
      // Create new record
      const id = randomUUID();
      const newData: FinancialData = { 
        id,
        companyId: data.companyId,
        period: data.period,
        periodType: data.periodType,
        totalRevenue: data.totalRevenue || "0",
        grossProfit: data.grossProfit || "0",
        netIncome: data.netIncome || "0",
        operatingIncome: data.operatingIncome || "0",
        costOfGoodsSold: data.costOfGoodsSold || "0",
        operatingExpenses: data.operatingExpenses || "0",
        totalAssets: data.totalAssets || "0",
        currentAssets: data.currentAssets || "0",
        inventory: data.inventory || "0",
        accountsReceivable: data.accountsReceivable || "0",
        totalLiabilities: data.totalLiabilities || "0",
        currentLiabilities: data.currentLiabilities || "0",
        accountsPayable: data.accountsPayable || "0",
        totalEquity: data.totalEquity || "0",
        operatingCashFlow: data.operatingCashFlow || "0",
        investingCashFlow: data.investingCashFlow || "0",
        financingCashFlow: data.financingCashFlow || "0",
        marketingSpend: data.marketingSpend || "0",
        newCustomers: data.newCustomers || 0,
        totalCustomers: data.totalCustomers || 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this.financialData.set(id, newData);
      return newData;
    }
  }

  async getFinancialDataRange(companyId: string, startPeriod: string, endPeriod: string): Promise<FinancialData[]> {
    return Array.from(this.financialData.values())
      .filter(data => 
        data.companyId === companyId && 
        data.period >= startPeriod && 
        data.period <= endPeriod
      )
      .sort((a, b) => a.period.localeCompare(b.period));
  }
}

import { DbStorage } from './db-storage';

export const storage = new DbStorage();
