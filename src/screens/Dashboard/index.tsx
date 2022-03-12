import React, {useCallback, useEffect, useState} from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import {ActivityIndicator} from 'react-native'
import {useFocusEffect} from '@react-navigation/native'
import {useTheme} from 'styled-components'
import { HightLightCard } from '../../components/HightLightCard'
import { TransactionCard, TransactionCardProps } from '../../components/TransactionCard'
import { 
  Container,
  Header,
  UserWrapper,
  UserInfo,
  Photo,
  User,
  UserGreeting,
  UserName,
  Icon,
  HightLightCards,
  Transactions,
  Title,
  TransactionList,
  LoadContainer
} from './styles'

export interface DataListProps extends TransactionCardProps{
  id: string
}

interface highLightProps {
  amount: string;
  lastTransaction: string;
}

interface HighLightData{
  entries: highLightProps,
  expensives: highLightProps,
  total: highLightProps

}

export const Dashboard = () => {
  const [isLoading, setIsLoading] = useState(true)
  const [transactions, setTransactions] = useState<DataListProps[]>([])
  const [highLightData, setHighLightData] = useState<HighLightData>({} as HighLightData)

  const theme = useTheme()

  function getLastTransactionDate(
    collection: DataListProps[],
    type: 'positive' | 'negative'
    ){
    const lastTransaction = new Date (
      Math.max.apply(Math, collection
      .filter((transaction) => transaction.type === type)
      .map((transaction) => new Date(transaction.date).getTime()))
    )
      return `${lastTransaction.getDate()} de ${lastTransaction.toLocaleString('pt-BR', {month: 'long'})}`;
  }

  async function loadTransactions(){
    const dataKey = '@gofinances:transactions'
    const response = await AsyncStorage.getItem(dataKey)
    // await AsyncStorage.removeItem(dataKey)
    // console.log(response)

    let entriesTotal = 0;
    let expensiveTotal = 0;

        
    const transactions = response ? JSON.parse(response) : []
    // console.log(transactions)
    
    
    const transactionFormatted: DataListProps[] = transactions
    .map((item: DataListProps) => {

      if(item.type === 'positive'){
        entriesTotal += Number(item.amount)
      } else {
        expensiveTotal += Number(item.amount)
      }

      const amount = Number(item.amount).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      })
      
      const date = Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit'
      }).format(new Date(item.date))
      
      return {
        id: item.id,
        name: item.name,
        amount,
        type: item.type,
        category: item.category,
        date
      }
      
    })


    setTransactions(transactionFormatted)
    const lastTransactionsEntries = getLastTransactionDate(transactions, 'positive')
    const lastTransactionsExpensives = getLastTransactionDate(transactions, 'negative')
    const totalInterval = `01 a ${lastTransactionsExpensives}`
    
    const total = entriesTotal - expensiveTotal
    setHighLightData({
      entries: {
        amount: entriesTotal.toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }),
        lastTransaction: `Última entrada dia ${lastTransactionsEntries}`,
      },
      expensives: {
        amount: expensiveTotal.toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }),
        lastTransaction: `Última saída dia ${lastTransactionsExpensives}`,
      },
      total: {
        amount: total.toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }),
        lastTransaction: totalInterval
      }
    })
    setIsLoading(false)
  }

  useEffect(() => {
    loadTransactions()
    // const dataKey = '@gofinances:transactions'
    // AsyncStorage.remove(dataKey)
  }, [])

  useFocusEffect(useCallback(() => {
    loadTransactions()
  },[]))

    return (
      <Container>
        { isLoading ? 
        <LoadContainer>
          <ActivityIndicator 
          color={theme.colors.primary} 
          size="large"
          />
        </LoadContainer> 
          : 
          <>
          <Header>
            <UserWrapper>
            <UserInfo>
              <Photo source={{uri: 'https://avatars.githubusercontent.com/u/26610772?v=4'}}/>
              <User>
                <UserGreeting>Olá</UserGreeting>
                <UserName>Arthur</UserName>
              </User>
            </UserInfo>
              <Icon name="power"/>
            </UserWrapper>
          </Header>
          <HightLightCards>
            <HightLightCard 
            type="up"
            title='Entradas' 
            amount={highLightData.entries.amount} 
            lastTransaction={highLightData.entries.lastTransaction}
            />
            <HightLightCard 
            type="down"
            title='Saídas' 
            amount={highLightData.expensives.amount} 
            lastTransaction={highLightData.expensives.lastTransaction}
            />
            <HightLightCard 
            type="total"
            title='Total'
            amount={highLightData.total.amount} 
            lastTransaction={highLightData.total.lastTransaction}
            />
          </HightLightCards>
          <Transactions>
            <Title>Listagem</Title>
            <TransactionList 
            data={transactions}
            keyExtractor={item => item.id}
            renderItem={({item}) => <TransactionCard data={item}/>}
            />
          </Transactions>
          </>
        }
        </Container>
    )
  }